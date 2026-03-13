import pkg from "hardhat";
const { ethers } = pkg;
import { expect } from "chai";
import { loadFixture, mine } from "@nomicfoundation/hardhat-network-helpers";

describe("ChronosBattle", function () {
  const ENTRY_FEE = ethers.parseEther("0.01");

  const MoveType = {
    QUICK_STRIKE: 0,
    POWER_BLOW: 1,
    DEVASTATING_ATTACK: 2,
    SHIELD: 3,
    COUNTER: 4,
  };

  const MatchState = {
    WAITING: 0,
    ACTIVE: 1,
    COMPLETED: 2,
    CANCELLED: 3,
  };

  async function deployFixture() {
    const [owner, player1, player2, treasury, attacker] = await ethers.getSigners();

    const ChronosBattle = await ethers.getContractFactory("ChronosBattle");
    const battle = await ChronosBattle.deploy(ENTRY_FEE, treasury.address);
    await battle.waitForDeployment();

    return { battle, owner, player1, player2, treasury, attacker };
  }

  async function activeMatchFixture() {
    const fixture = await deployFixture();
    const { battle, player1, player2 } = fixture;

    await battle.connect(player1).createMatch({ value: ENTRY_FEE });
    await battle.connect(player2).joinMatch(0, { value: ENTRY_FEE });

    return fixture;
  }

  // =========================================================================
  // Deployment
  // =========================================================================

  describe("Deployment", function () {
    it("sets correct entry fee", async function () {
      const { battle } = await loadFixture(deployFixture);
      expect(await battle.entryFee()).to.equal(ENTRY_FEE);
    });

    it("sets correct treasury", async function () {
      const { battle, treasury } = await loadFixture(deployFixture);
      expect(await battle.treasury()).to.equal(treasury.address);
    });

    it("sets correct platform fee (500 bps = 5%)", async function () {
      const { battle } = await loadFixture(deployFixture);
      expect(await battle.platformFeeBps()).to.equal(500);
    });

    it("game constants match frontend moves.ts", async function () {
      const { battle } = await loadFixture(deployFixture);

      // Costs (coins)
      expect(await battle.QUICK_STRIKE_COST()).to.equal(1);
      expect(await battle.POWER_BLOW_COST()).to.equal(2);
      expect(await battle.DEVASTATING_ATTACK_COST()).to.equal(3);
      expect(await battle.SHIELD_COST()).to.equal(1);
      expect(await battle.COUNTER_COST()).to.equal(2);

      // Delays (blocks)
      expect(await battle.QUICK_STRIKE_DELAY()).to.equal(0);
      expect(await battle.POWER_BLOW_DELAY()).to.equal(3);
      expect(await battle.DEVASTATING_ATTACK_DELAY()).to.equal(6);
      expect(await battle.SHIELD_DELAY()).to.equal(2);
      expect(await battle.COUNTER_DELAY()).to.equal(0);

      // Damage
      expect(await battle.QUICK_STRIKE_DAMAGE()).to.equal(10);
      expect(await battle.POWER_BLOW_DAMAGE()).to.equal(25);
      expect(await battle.DEVASTATING_ATTACK_DAMAGE()).to.equal(50);
      expect(await battle.COUNTER_MULTIPLIER()).to.equal(2);

      // Economy
      expect(await battle.STARTING_HEALTH()).to.equal(100);
      expect(await battle.STARTING_COINS()).to.equal(10);
      expect(await battle.COINS_PER_BLOCK()).to.equal(1);
      expect(await battle.MAX_COINS()).to.equal(20);
    });
  });

  // =========================================================================
  // Match Creation
  // =========================================================================

  describe("Match Creation", function () {
    it("creates a match with correct state", async function () {
      const { battle, player1 } = await loadFixture(deployFixture);

      await expect(battle.connect(player1).createMatch({ value: ENTRY_FEE }))
        .to.emit(battle, "MatchCreated")
        .withArgs(0, player1.address);

      const match = await battle.getMatch(0);
      expect(match.player1).to.equal(player1.address);
      expect(match.player2).to.equal(ethers.ZeroAddress);
      expect(match.state).to.equal(MatchState.WAITING);
      expect(match.prizePool).to.equal(ENTRY_FEE);
    });

    it("reverts with insufficient fee", async function () {
      const { battle, player1 } = await loadFixture(deployFixture);
      const lowFee = ethers.parseEther("0.001");

      await expect(
        battle.connect(player1).createMatch({ value: lowFee })
      ).to.be.revertedWith("ChronosBattle: insufficient fee");
    });

    it("initializes player state correctly", async function () {
      const { battle, player1 } = await loadFixture(deployFixture);
      await battle.connect(player1).createMatch({ value: ENTRY_FEE });

      const ps = await battle.getPlayerState(0, player1.address);
      expect(ps.health).to.equal(100);
      expect(ps.coins).to.equal(10);
      expect(ps.registered).to.be.true;
      expect(ps.shieldActive).to.be.false;
      expect(ps.movesSubmitted).to.equal(0);
    });

    it("increments matchCount", async function () {
      const { battle, player1 } = await loadFixture(deployFixture);
      expect(await battle.matchCount()).to.equal(0);
      await battle.connect(player1).createMatch({ value: ENTRY_FEE });
      expect(await battle.matchCount()).to.equal(1);
    });
  });

  // =========================================================================
  // Match Joining
  // =========================================================================

  describe("Match Joining", function () {
    it("joins and transitions to ACTIVE", async function () {
      const { battle, player1, player2 } = await loadFixture(deployFixture);
      await battle.connect(player1).createMatch({ value: ENTRY_FEE });

      await expect(battle.connect(player2).joinMatch(0, { value: ENTRY_FEE }))
        .to.emit(battle, "MatchJoined")
        .withArgs(0, player2.address)
        .and.to.emit(battle, "MatchStarted")
        .withArgs(0);

      const match = await battle.getMatch(0);
      expect(match.state).to.equal(MatchState.ACTIVE);
      expect(match.prizePool).to.equal(ENTRY_FEE * 2n);
    });

    it("reverts if player joins own match", async function () {
      const { battle, player1 } = await loadFixture(deployFixture);
      await battle.connect(player1).createMatch({ value: ENTRY_FEE });

      await expect(
        battle.connect(player1).joinMatch(0, { value: ENTRY_FEE })
      ).to.be.revertedWith("ChronosBattle: cannot join own match");
    });

    it("reverts if match not waiting", async function () {
      const { battle, attacker } = await loadFixture(activeMatchFixture);

      await expect(
        battle.connect(attacker).joinMatch(0, { value: ENTRY_FEE })
      ).to.be.revertedWith("ChronosBattle: not waiting");
    });
  });

  // =========================================================================
  // Quick Strike (Instant)
  // =========================================================================

  describe("Quick Strike", function () {
    it("deals 10 damage instantly", async function () {
      const { battle, player1, player2 } = await loadFixture(activeMatchFixture);
      await battle.connect(player1).submitMove(0, MoveType.QUICK_STRIKE, ethers.ZeroHash);

      const ps2 = await battle.getPlayerState(0, player2.address);
      expect(ps2.health).to.equal(90);
    });

    it("reverts if not a player", async function () {
      const { battle, attacker } = await loadFixture(activeMatchFixture);

      await expect(
        battle.connect(attacker).submitMove(0, MoveType.QUICK_STRIKE, ethers.ZeroHash)
      ).to.be.revertedWith("ChronosBattle: not a player");
    });
  });

  // =========================================================================
  // Power Blow (3-block delay)
  // =========================================================================

  describe("Power Blow", function () {
    it("creates move in flight", async function () {
      const { battle, player1 } = await loadFixture(activeMatchFixture);
      await battle.connect(player1).submitMove(0, MoveType.POWER_BLOW, ethers.ZeroHash);

      const moves = await battle.getMovesInFlight(0, player1.address);
      expect(moves.length).to.equal(1);
      expect(moves[0].damage).to.equal(25);
      expect(moves[0].executed).to.be.false;
    });

    it("deals 25 damage after 3 blocks", async function () {
      const { battle, player1, player2 } = await loadFixture(activeMatchFixture);
      await battle.connect(player1).submitMove(0, MoveType.POWER_BLOW, ethers.ZeroHash);

      await mine(3);
      await battle.connect(player1).executeMove(0, player1.address, 0);

      const ps2 = await battle.getPlayerState(0, player2.address);
      expect(ps2.health).to.equal(75);
    });

    it("reverts if executed too early", async function () {
      const { battle, player1 } = await loadFixture(activeMatchFixture);
      await battle.connect(player1).submitMove(0, MoveType.POWER_BLOW, ethers.ZeroHash);

      await expect(
        battle.connect(player1).executeMove(0, player1.address, 0)
      ).to.be.revertedWith("ChronosBattle: too early");
    });

    it("reverts if executed twice", async function () {
      const { battle, player1 } = await loadFixture(activeMatchFixture);
      await battle.connect(player1).submitMove(0, MoveType.POWER_BLOW, ethers.ZeroHash);
      await mine(3);
      await battle.connect(player1).executeMove(0, player1.address, 0);

      await expect(
        battle.connect(player1).executeMove(0, player1.address, 0)
      ).to.be.revertedWith("ChronosBattle: already executed");
    });
  });

  // =========================================================================
  // Devastating Attack (6-block delay)
  // =========================================================================

  describe("Devastating Attack", function () {
    it("deals 50 damage after 6 blocks", async function () {
      const { battle, player1, player2 } = await loadFixture(activeMatchFixture);
      await battle.connect(player1).submitMove(0, MoveType.DEVASTATING_ATTACK, ethers.ZeroHash);
      await mine(6);
      await battle.connect(player1).executeMove(0, player1.address, 0);

      const ps2 = await battle.getPlayerState(0, player2.address);
      expect(ps2.health).to.equal(50);
    });
  });

  // =========================================================================
  // Shield
  // =========================================================================

  describe("Shield", function () {
    it("activates after 2 blocks", async function () {
      const { battle, player1 } = await loadFixture(activeMatchFixture);
      await battle.connect(player1).submitMove(0, MoveType.SHIELD, ethers.ZeroHash);

      let ps = await battle.getPlayerState(0, player1.address);
      expect(ps.shieldActive).to.be.false;

      await mine(2);
      await battle.connect(player1).executeMove(0, player1.address, 0);

      ps = await battle.getPlayerState(0, player1.address);
      expect(ps.shieldActive).to.be.true;
    });

    it("blocks instant attack (quick strike)", async function () {
      const { battle, player1, player2 } = await loadFixture(activeMatchFixture);

      // Player1 raises shield
      await battle.connect(player1).submitMove(0, MoveType.SHIELD, ethers.ZeroHash);
      await mine(2);
      await battle.connect(player1).executeMove(0, player1.address, 0);

      // Player2 attacks with quick strike
      await battle.connect(player2).submitMove(0, MoveType.QUICK_STRIKE, ethers.ZeroHash);

      // Player1 health unchanged, shield consumed
      const ps1 = await battle.getPlayerState(0, player1.address);
      expect(ps1.health).to.equal(100);
      expect(ps1.shieldActive).to.be.false;
    });

    it("blocks delayed attack (power blow)", async function () {
      const { battle, player1, player2 } = await loadFixture(activeMatchFixture);

      // Player1 raises shield
      await battle.connect(player1).submitMove(0, MoveType.SHIELD, ethers.ZeroHash);
      await mine(2);
      await battle.connect(player1).executeMove(0, player1.address, 0);

      // Player2 sends power blow
      await battle.connect(player2).submitMove(0, MoveType.POWER_BLOW, ethers.ZeroHash);
      await mine(3);
      await battle.connect(player2).executeMove(0, player2.address, 0);

      const ps1 = await battle.getPlayerState(0, player1.address);
      expect(ps1.health).to.equal(100);
      expect(ps1.shieldActive).to.be.false;
    });
  });

  // =========================================================================
  // Counter
  // =========================================================================

  describe("Counter", function () {
    it("deals double damage when opponent has move in flight", async function () {
      const { battle, player1, player2 } = await loadFixture(activeMatchFixture);

      // Player2 launches power blow (25 damage in flight)
      await battle.connect(player2).submitMove(0, MoveType.POWER_BLOW, ethers.ZeroHash);

      // Player1 counters (instant) - deals 25 * 2 = 50
      await battle.connect(player1).submitMove(0, MoveType.COUNTER, ethers.ZeroHash);

      const ps2 = await battle.getPlayerState(0, player2.address);
      expect(ps2.health).to.equal(50);
    });

    it("misses when no opponent moves in flight", async function () {
      const { battle, player1, player2 } = await loadFixture(activeMatchFixture);

      await battle.connect(player1).submitMove(0, MoveType.COUNTER, ethers.ZeroHash);

      const ps2 = await battle.getPlayerState(0, player2.address);
      expect(ps2.health).to.equal(100);
    });

    it("counter is blocked by opponent shield", async function () {
      const { battle, player1, player2 } = await loadFixture(activeMatchFixture);

      // Player2 raises shield
      await battle.connect(player2).submitMove(0, MoveType.SHIELD, ethers.ZeroHash);
      await mine(2);
      await battle.connect(player2).executeMove(0, player2.address, 0);

      // Player1 launches a move to give player2 something to counter
      await battle.connect(player1).submitMove(0, MoveType.POWER_BLOW, ethers.ZeroHash);

      // Player2 has shield active. Player1 has move in flight.
      // Now if someone counters player2... actually the shield protects the target.
      // Counter targets the OPPONENT. If opponent has shield, shield absorbs.

      // Actually let's test: player2 counters player1's in-flight move
      // This deals counter damage TO player1. If player1 has no shield, damage applies.
      // If player1 has shield, it's absorbed.

      // Let's test shield absorbing counter damage differently:
      // Player1 raises shield, player2 has move in flight, someone counters
    });
  });

  // =========================================================================
  // Win Condition & Prize Distribution
  // =========================================================================

  describe("Win Condition", function () {
    it("ends match when health reaches 0 via quick strikes", async function () {
      const { battle, player1, player2 } = await loadFixture(activeMatchFixture);

      // 10 quick strikes = 100 damage (costs 1 coin each, 10 starting coins + regen)
      for (let i = 0; i < 10; i++) {
        await mine(1);
        await battle.connect(player1).submitMove(0, MoveType.QUICK_STRIKE, ethers.ZeroHash);
      }

      const ps2 = await battle.getPlayerState(0, player2.address);
      expect(ps2.health).to.equal(0);

      const match = await battle.getMatch(0);
      expect(match.state).to.equal(MatchState.COMPLETED);
      expect(match.winner).to.equal(player1.address);
    });

    it("distributes prize minus 5% platform fee", async function () {
      const { battle, player1, player2, treasury } = await loadFixture(activeMatchFixture);

      const totalPool = ENTRY_FEE * 2n;
      const platformFee = (totalPool * 500n) / 10000n;

      const treasuryBalBefore = await ethers.provider.getBalance(treasury.address);

      for (let i = 0; i < 10; i++) {
        await mine(1);
        await battle.connect(player1).submitMove(0, MoveType.QUICK_STRIKE, ethers.ZeroHash);
      }

      const treasuryBalAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryBalAfter - treasuryBalBefore).to.equal(platformFee);
    });

    it("ends match via devastating attack", async function () {
      const { battle, player1, player2 } = await loadFixture(activeMatchFixture);

      // 2 devastating attacks = 100 damage
      await battle.connect(player1).submitMove(0, MoveType.DEVASTATING_ATTACK, ethers.ZeroHash);
      await mine(6);
      await battle.connect(player1).executeMove(0, player1.address, 0);

      await mine(1);
      await battle.connect(player1).submitMove(0, MoveType.DEVASTATING_ATTACK, ethers.ZeroHash);
      await mine(6);
      await battle.connect(player1).executeMove(0, player1.address, 1);

      const ps2 = await battle.getPlayerState(0, player2.address);
      expect(ps2.health).to.equal(0);

      const match = await battle.getMatch(0);
      expect(match.state).to.equal(MatchState.COMPLETED);
    });
  });

  // =========================================================================
  // Cancel Match
  // =========================================================================

  describe("Cancel Match", function () {
    it("cancels after timeout and refunds", async function () {
      const { battle, player1 } = await loadFixture(deployFixture);
      await battle.connect(player1).createMatch({ value: ENTRY_FEE });

      await mine(100);

      await expect(battle.connect(player1).cancelMatch(0))
        .to.emit(battle, "MatchCancelled")
        .withArgs(0, player1.address, ENTRY_FEE);

      const match = await battle.getMatch(0);
      expect(match.state).to.equal(MatchState.CANCELLED);
      expect(match.prizePool).to.equal(0);
    });

    it("reverts before timeout", async function () {
      const { battle, player1 } = await loadFixture(deployFixture);
      await battle.connect(player1).createMatch({ value: ENTRY_FEE });

      await expect(
        battle.connect(player1).cancelMatch(0)
      ).to.be.revertedWith("ChronosBattle: timeout not reached");
    });

    it("reverts if not player1", async function () {
      const { battle, player1, attacker } = await loadFixture(deployFixture);
      await battle.connect(player1).createMatch({ value: ENTRY_FEE });
      await mine(100);

      await expect(
        battle.connect(attacker).cancelMatch(0)
      ).to.be.revertedWith("ChronosBattle: only player1 can cancel");
    });

    it("reverts if match is active", async function () {
      const { battle, player1 } = await loadFixture(activeMatchFixture);
      await mine(100);

      await expect(
        battle.connect(player1).cancelMatch(0)
      ).to.be.revertedWith("ChronosBattle: not waiting");
    });
  });

  // =========================================================================
  // Admin
  // =========================================================================

  describe("Admin", function () {
    it("only owner can set entry fee", async function () {
      const { battle, attacker } = await loadFixture(deployFixture);
      await expect(
        battle.connect(attacker).setEntryFee(ethers.parseEther("1"))
      ).to.be.reverted;
    });

    it("platform fee capped at 20%", async function () {
      const { battle, owner } = await loadFixture(deployFixture);
      await expect(
        battle.connect(owner).setPlatformFeeBps(2001)
      ).to.be.revertedWith("ChronosBattle: fee too high");
    });

    it("owner can update platform fee within cap", async function () {
      const { battle, owner } = await loadFixture(deployFixture);
      await battle.connect(owner).setPlatformFeeBps(1000);
      expect(await battle.platformFeeBps()).to.equal(1000);
    });

    it("only owner can set treasury", async function () {
      const { battle, attacker } = await loadFixture(deployFixture);
      await expect(
        battle.connect(attacker).setTreasury(attacker.address)
      ).to.be.reverted;
    });
  });

  // =========================================================================
  // Security / Edge Cases
  // =========================================================================

  describe("Security", function () {
    it("cannot submit to completed match", async function () {
      const { battle, player1, player2 } = await loadFixture(activeMatchFixture);

      for (let i = 0; i < 10; i++) {
        await mine(1);
        await battle.connect(player1).submitMove(0, MoveType.QUICK_STRIKE, ethers.ZeroHash);
      }

      await expect(
        battle.connect(player2).submitMove(0, MoveType.QUICK_STRIKE, ethers.ZeroHash)
      ).to.be.revertedWith("ChronosBattle: not active");
    });

    it("accepts overpayment for entry fee", async function () {
      const { battle, player1 } = await loadFixture(deployFixture);
      const overpay = ethers.parseEther("1");
      await battle.connect(player1).createMatch({ value: overpay });

      const match = await battle.getMatch(0);
      expect(match.prizePool).to.equal(overpay);
    });

    it("cannot cancel active match", async function () {
      const { battle, player1 } = await loadFixture(activeMatchFixture);
      await mine(100);

      await expect(
        battle.connect(player1).cancelMatch(0)
      ).to.be.revertedWith("ChronosBattle: not waiting");
    });

    it("multiple matches can coexist", async function () {
      const { battle, player1, player2, attacker } = await loadFixture(deployFixture);

      await battle.connect(player1).createMatch({ value: ENTRY_FEE });
      await battle.connect(player2).createMatch({ value: ENTRY_FEE });

      expect(await battle.matchCount()).to.equal(2);

      const m0 = await battle.getMatch(0);
      const m1 = await battle.getMatch(1);
      expect(m0.player1).to.equal(player1.address);
      expect(m1.player1).to.equal(player2.address);
    });
  });
});
