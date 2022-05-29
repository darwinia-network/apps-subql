import { SubstrateEvent } from "@subql/types";
import { Balance, BlockNumber } from "@polkadot/types/interfaces";
import { FeeMarketEntity, OrderEntity, RelayerEntity, SlashEntity, OrderPhase } from "../../types";

const FEE_MARKET_ENTITY_ID = "fee-market-entity-id";

export async function handleFeeMarketOrderCreatedEvent(event: SubstrateEvent): Promise<void> {
  // https://github.com/darwinia-network/darwinia-bridges-substrate/pull/89
  const {
    event: {
      data: [laneId, messageNonce, fee, assignedRelayers, outOfSlot],
    },
  } = event;

  const signer = event.extrinsic.extrinsic.signer.toString();
  const blockNumber = event.block.block.header.number.toNumber();
  const blockTimestamp = event.block.timestamp;
  const extrinsicIndex = event.extrinsic.idx;
  const eventIndex = event.idx;

  const orderRecord = new OrderEntity(messageNonce.toString());
  const feeMarketRecord =
    (await FeeMarketEntity.get(FEE_MARKET_ENTITY_ID)) || new FeeMarketEntity(FEE_MARKET_ENTITY_ID);

  orderRecord.fee = (fee as Balance).toBigInt();
  orderRecord.sender = signer;

  orderRecord.slotTime = Number(api.consts.feeMarket.slot);
  orderRecord.outOfSlot = (outOfSlot as BlockNumber).toNumber();

  orderRecord.phase = OrderPhase.Created;
  orderRecord.atCreated = {
    signer,
    blockTimestamp,
    blockNumber,
    extrinsicIndex,
    eventIndex,
    laneId: laneId.toString(),
  };

  // TODO: relayer entity create
  orderRecord.assignedRelayersId = assignedRelayers as unknown as string[];

  const { totalOrders = 0, totalInProgress = 0 } = feeMarketRecord;

  feeMarketRecord.totalInProgress = totalOrders + 1;
  feeMarketRecord.totalInProgress = totalInProgress + 1;

  await orderRecord.save();
  await feeMarketRecord.save();
}

export async function handleMessagesDeliveredEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [laneId, data],
    },
  } = event;
  const { begin, end, dispatchResults } = data.toJSON() as { begin: number; end: number; dispatchResults: string };
  void dispatchResults;

  const signer = event.extrinsic.extrinsic.signer.toString();
  const blockTimestamp = event.block.timestamp;
  const blockNumber = event.block.block.header.number.toNumber();
  const extrinsicIndex = event.extrinsic.idx;
  const eventIndex = event.idx;

  for (let nonce = begin; nonce <= end; nonce++) {
    const orderRecord = await OrderEntity.get(nonce.toString());
    const feeMarketRecord =
      (await FeeMarketEntity.get(FEE_MARKET_ENTITY_ID)) || new FeeMarketEntity(FEE_MARKET_ENTITY_ID);

    if (!orderRecord) {
      logger.warn(`[handleMessagesDeliveredEvent] order ${nonce.toString()} not found`);
      continue;
    }

    const { slotTime, outOfSlot } = orderRecord;
    const { blockNumber: orderStartBlock, blockTimestamp: orderStartTimestamp } = orderRecord.atCreated;

    const speed = blockTimestamp.getTime() - orderStartTimestamp.getTime();

    const { totalFinished = 0, totalOutOfSlot = 0, averageSpeed = speed } = feeMarketRecord;

    orderRecord.phase = OrderPhase.Delivered;
    orderRecord.atDelivered = {
      signer,
      blockTimestamp,
      blockNumber,
      extrinsicIndex,
      eventIndex,
      laneId: laneId.toString(),
    };

    if (blockNumber >= outOfSlot) {
      orderRecord.confirmedSlotIndex = -1;
      feeMarketRecord.totalOutOfSlot = totalOutOfSlot + 1;
    } else if (blockNumber <= orderStartBlock + slotTime * 1) {
      orderRecord.confirmedSlotIndex = 0;
    } else if (blockNumber <= orderStartBlock + slotTime * 2) {
      orderRecord.confirmedSlotIndex = 1;
    } else if (blockNumber < orderStartBlock + slotTime * 3) {
      orderRecord.confirmedSlotIndex = 2;
    }

    feeMarketRecord.totalFinished = totalFinished + 1;
    feeMarketRecord.averageSpeed = (averageSpeed + speed) / 2;

    await orderRecord.save();
    await feeMarketRecord.save();
  }

  // https://crab.subscan.io/extrinsic/0x66429ff86da3ec25424977eb0fae64725d9f319f66d2f805a04cae24cae0e433?event=10564550-4
  // ["0x00000000",{"begin":76,"end":76,"dispatchResults":"0x80"}]
  // logger.error(`jay debug: ${data.toString()}`);
}

export async function handleFeeMarketUpdateRelayFeeEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [account, amount],
    },
  } = event;

  const blockNumber = event.block.block.header.number.toNumber();
  const blockTimestamp = event.block.timestamp;
  const extrinsicIndex = event.extrinsic.idx;
  const eventIndex = event.idx;

  const record = (await RelayerEntity.get(account.toString())) || new RelayerEntity(account.toString());

  record.feeHistory = (record.feeHistory || []).concat([
    {
      fee: (amount as Balance).toBigInt(),
      blockTimestamp,
      blockNumber,
      extrinsicIndex,
      eventIndex,
    },
  ]);

  await record.save();

  // https://crab.subscan.io/extrinsic/0xb51aae558abe64037147ec81ae4097702a5c8b0ae838bb9b3235aff2996271ae?event=10389610-1
  // [5CVJNZNyGFjj3NsYPV7xkDnLS3UKsCRSxWdKdDuCjbT7qWhH, 19999999999]
  // logger.error(`jay debug: [${account}, ${amount}]`);
}

export async function handleFeeMarketSlashEvent(event: SubstrateEvent): Promise<void> {
  // https://darwinia.subscan.io/extrinsic/0xb9e24418ec2f525561ce329e718af56e86059de2e712dbfb2b1a71705f47ff78?event=8419748-5
  const {
    event: {
      // data: [account, amount, confirmTime, delayTime, laneId, messageNonce, sentTime],
      data: [slashData],
    },
  } = event;

  const { lane, message, sentTime, confirmTime, delayTime, accountId, amount } = slashData.toJSON() as unknown as {
    lane: string;
    message: number;
    sentTime: number;
    confirmTime: number;
    delayTime: number;
    accountId: string;
    amount: bigint;
  };

  const blockNumber = event.block.block.header.number.toNumber();
  const blockTimestamp = event.block.timestamp;
  const extrinsicIndex = event.extrinsic.idx;
  const eventIndex = event.idx;

  const orderId = message.toString();
  const slashId = `${blockNumber}-${eventIndex}`;

  const orderRecord = await OrderEntity.get(orderId);
  const slashRecord = new SlashEntity(slashId);

  if (!orderRecord) {
    logger.warn(`[handleFeeMarketSlashEvent] order ${orderId} not found`);
    return;
  }

  slashRecord.orderId = orderId;

  slashRecord.blockNumber = blockNumber;
  slashRecord.blockTimestamp = blockTimestamp;
  slashRecord.extrinsicIndex = extrinsicIndex;
  slashRecord.eventIndex = eventIndex;

  slashRecord.laneId = lane;
  slashRecord.confirmTime = confirmTime;
  slashRecord.sentTime = sentTime;
  slashRecord.delayTime = delayTime;

  slashRecord.amount = amount;
  slashRecord.relayerId = accountId;

  await slashRecord.save();
}

export async function handleFeeMarketOrderRewardEvent(_: SubstrateEvent): Promise<void> {
  // https://github.com/darwinia-network/darwinia-bridges-substrate/pull/89
  // const { event: {
  //   data: [laneId, messageNonce, rewards]
  // } } = event;
  // const signer = event.extrinsic.extrinsic.signer.toString();
  // const blockNumber = event.block.block.header.number.toNumber();
  // const blockTimestamp = event.block.timestamp;
  // const extrinsicIndex = event.extrinsic.idx;
  // const eventIndex = event.idx;
}
