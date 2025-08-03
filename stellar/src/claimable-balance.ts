export class ClaimableBalance {
  private id: string;
  private amount: string;
  private asset: string;
  private claimants: string[];

  constructor(id: string, amount: string, asset: string, claimants: string[] = []) {
    this.id = id;
    this.amount = amount;
    this.asset = asset;
    this.claimants = claimants;
  }

  getId(): string {
    return this.id;
  }

  getAmount(): string {
    return this.amount;
  }

  getAsset(): string {
    return this.asset;
  }

  getClaimants(): string[] {
    return this.claimants;
  }

  addClaimant(claimant: string): void {
    this.claimants.push(claimant);
  }

  removeClaimant(claimant: string): void {
    const index = this.claimants.indexOf(claimant);
    if (index > -1) {
      this.claimants.splice(index, 1);
    }
  }

  toJSON() {
    return {
      id: this.id,
      amount: this.amount,
      asset: this.asset,
      claimants: this.claimants
    };
  }
} 