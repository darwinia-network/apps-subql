import { SubstrateExtrinsic, SubstrateEvent } from "@subql/types";
import { StakingRecordEntity, StakingType, TokenSymbol } from "../types";

const UNBONDING_PERIOD = 14 * 24 * 60 * 60 * 1000; // 14-day unbonding period

const getMonths = (start: number, expire: number) => {
  return start >= expire ? 0 : (expire - start) / 1000 / 60 / 60 / 24 / 30;
};

export async function handleStakingBondRingEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [amount, startTime, expireTime],
    },
  } = event;

  const record = new StakingRecordEntity(event.extrinsic.extrinsic.hash.toString());

  record.account = event.extrinsic.extrinsic.signer.toString();
  record.type = StakingType.Bonded;
  record.tokenSymbol = TokenSymbol.RING;

  record.amount = amount.toString();
  record.months = getMonths(Number(startTime.toString()), Number(expireTime.toString()));
  record.startTime = Number(startTime.toString());
  record.expireTime = Number(expireTime.toString());

  record.blockTime = event.block.timestamp.getTime();
  record.blockNumber = event.block.block.header.number.toNumber();
  record.extrinsicIndex = event.extrinsic.idx;

  await record.save();
}

export async function handleStakingRingBondedEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [account, amount, startTime, expireTime],
    },
  } = event;

  const record = new StakingRecordEntity(event.extrinsic.extrinsic.hash.toString());

  record.account = account.toString();
  record.type = StakingType.Bonded;
  record.tokenSymbol = TokenSymbol.RING;

  record.amount = amount.toString();
  record.months = getMonths(Number(expireTime.toString()), Number(startTime.toString()));
  record.startTime = Number(startTime.toString());
  record.expireTime = Number(expireTime.toString());

  record.blockTime = event.block.timestamp.getTime();
  record.blockNumber = event.block.block.header.number.toNumber();
  record.extrinsicIndex = event.extrinsic.idx;

  await record.save();
}

export async function handleStakingKtonBondedEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [account, amount],
    },
  } = event;

  const record = new StakingRecordEntity(event.extrinsic.extrinsic.hash.toString());

  record.account = account.toString();
  record.type = StakingType.Bonded;
  record.tokenSymbol = TokenSymbol.KTON;

  record.amount = amount.toString();

  record.blockTime = event.block.timestamp.getTime();
  record.blockNumber = event.block.block.header.number.toNumber();
  record.extrinsicIndex = event.extrinsic.idx;

  await record.save();
}

export async function handleStakingBondKtonEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [amount],
    },
  } = event;

  const record = new StakingRecordEntity(event.extrinsic.extrinsic.hash.toString());

  record.account = event.extrinsic.extrinsic.signer.toString();
  record.type = StakingType.Bonded;
  record.tokenSymbol = TokenSymbol.KTON;

  record.amount = amount.toString();

  record.blockTime = event.block.timestamp.getTime();
  record.blockNumber = event.block.block.header.number.toNumber();
  record.extrinsicIndex = event.extrinsic.idx;

  await record.save();
}

export async function handleStakingRingUnbondedEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [account, amount],
    },
  } = event;

  const record = new StakingRecordEntity(event.extrinsic.extrinsic.hash.toString());

  record.account = account.toString();
  record.type = StakingType.Unbonding;
  record.tokenSymbol = TokenSymbol.RING;

  record.amount = amount.toString();
  record.startTime = event.block.timestamp.getTime();
  record.expireTime = event.block.timestamp.getTime() + UNBONDING_PERIOD;

  record.blockTime = event.block.timestamp.getTime();
  record.blockNumber = event.block.block.header.number.toNumber();
  record.extrinsicIndex = event.extrinsic.idx;

  await record.save();
}

export async function handleStakingUnbondRingEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [amount, _],
    },
  } = event;

  const record = new StakingRecordEntity(event.extrinsic.extrinsic.hash.toString());

  record.account = event.extrinsic.extrinsic.signer.toString();
  record.type = StakingType.Unbonding;
  record.tokenSymbol = TokenSymbol.RING;

  record.amount = amount.toString();
  record.startTime = event.block.timestamp.getTime();
  record.expireTime = event.block.timestamp.getTime() + UNBONDING_PERIOD;

  record.blockTime = event.block.timestamp.getTime();
  record.blockNumber = event.block.block.header.number.toNumber();
  record.extrinsicIndex = event.extrinsic.idx;

  await record.save();
}

export async function handleStakingKtonUnbondedEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [account, amount],
    },
  } = event;

  const record = new StakingRecordEntity(event.extrinsic.extrinsic.hash.toString());

  record.account = account.toString();
  record.type = StakingType.Unbonding;
  record.tokenSymbol = TokenSymbol.KTON;

  record.amount = amount.toString();
  record.startTime = event.block.timestamp.getTime();
  record.expireTime = event.block.timestamp.getTime() + UNBONDING_PERIOD;

  record.blockTime = event.block.timestamp.getTime();
  record.blockNumber = event.block.block.header.number.toNumber();
  record.extrinsicIndex = event.extrinsic.idx;

  await record.save();
}

export async function handleStakingUnbondKtonEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [amount, _],
    },
  } = event;

  const record = new StakingRecordEntity(event.extrinsic.extrinsic.hash.toString());

  record.account = event.extrinsic.extrinsic.signer.toString();
  record.type = StakingType.Unbonding;
  record.tokenSymbol = TokenSymbol.KTON;

  record.amount = amount.toString();
  record.startTime = event.block.timestamp.getTime();
  record.expireTime = event.block.timestamp.getTime() + UNBONDING_PERIOD;

  record.blockTime = event.block.timestamp.getTime();
  record.blockNumber = event.block.block.header.number.toNumber();
  record.extrinsicIndex = event.extrinsic.idx;

  await record.save();
}

export async function handleTryClaimDepositsWithPunishCall(extrinsic: SubstrateExtrinsic): Promise<void> {
  const expireTime = extrinsic.extrinsic.method.args;

  const records = await StakingRecordEntity.getByAccount(extrinsic.extrinsic.signer.toString());
  const exist = records ? records.find((item) => item.expireTime === Number(expireTime.toString())) : null;

  if (exist) {
    exist.isUnlockEarlier = true;
    exist.earlierUnlockBlockTime = extrinsic.block.timestamp.getTime();
    exist.earlierUnlockBlockNumber = extrinsic.block.block.header.number.toNumber();
    exist.earlierUnlockExtrinsicIndex = extrinsic.idx;

    await exist.save();
  }
}
