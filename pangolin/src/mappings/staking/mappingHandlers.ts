import { SubstrateExtrinsic, SubstrateEvent } from "@subql/types";
import { StakingRecordEntity, StakingType, TokenSymbol } from "../../types";

export async function handleStakingBondRingEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [amount, startTime, expireTime],
    },
  } = event;

  const record = new StakingRecordEntity(event.extrinsic.extrinsic.hash.toString());

  record.account = event.extrinsic.extrinsic.signer.toString();
  record.type = startTime.toString() === expireTime.toString() ? StakingType.Bonded : StakingType.Locked;
  record.tokenSymbol = TokenSymbol.PRING;

  record.amount = amount.toString();
  record.startTime = startTime.toString();
  record.expireTime = expireTime.toString();

  record.blockTime = event.block.timestamp.getTime().toString();
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
  record.type = startTime.toString() === expireTime.toString() ? StakingType.Bonded : StakingType.Locked;
  record.tokenSymbol = TokenSymbol.PRING;

  record.amount = amount.toString();
  record.startTime = startTime.toString();
  record.expireTime = expireTime.toString();

  record.blockTime = event.block.timestamp.getTime().toString();
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
  record.tokenSymbol = TokenSymbol.PKTON;

  record.amount = amount.toString();

  record.blockTime = event.block.timestamp.getTime().toString();
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
  record.tokenSymbol = TokenSymbol.PKTON;

  record.amount = amount.toString();

  record.blockTime = event.block.timestamp.getTime().toString();
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
  record.type = StakingType.Unbond;
  record.tokenSymbol = TokenSymbol.PRING;

  record.amount = amount.toString();

  record.blockTime = event.block.timestamp.getTime().toString();
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
  record.type = StakingType.Unbond;
  record.tokenSymbol = TokenSymbol.PRING;

  record.amount = amount.toString();

  record.blockTime = event.block.timestamp.getTime().toString();
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
  record.type = StakingType.Unbond;
  record.tokenSymbol = TokenSymbol.PKTON;

  record.amount = amount.toString();

  record.blockTime = event.block.timestamp.getTime().toString();
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
  record.type = StakingType.Unbond;
  record.tokenSymbol = TokenSymbol.PKTON;

  record.amount = amount.toString();

  record.blockTime = event.block.timestamp.getTime().toString();
  record.blockNumber = event.block.block.header.number.toNumber();
  record.extrinsicIndex = event.extrinsic.idx;

  await record.save();
}

export async function handleTryClaimDepositsWithPunishCall(extrinsic: SubstrateExtrinsic): Promise<void> {
  const expireTime = extrinsic.extrinsic.method.args;

  const records = await StakingRecordEntity.getByAccount(extrinsic.extrinsic.signer.toString());
  const exist = records ? records.find((item) => item.expireTime === expireTime.toString()) : null;

  if (exist) {
    exist.isUnlockEarlier = true;
    exist.earlierUnlockBlockTime = extrinsic.block.timestamp.getTime().toString();
    exist.earlierUnlockBlockNumber = extrinsic.block.block.header.number.toNumber();
    exist.earlierUnlockExtrinsicIndex = extrinsic.idx;

    await exist.save();
  }
}
