import { SubstrateEvent } from "@subql/types";
import {
  Destination,
  OrderPhase,
  SlashEntity,
  RewardEntity,
  FeeMarketEntity,
  RelayerEntity,
  OrderEntity,
} from "../../types";
import { Option, Vec, u128, u64, u32, U8aFixed } from "@polkadot/types";
import { AccountId, AccountId32, Balance, BlockNumber } from "@polkadot/types/interfaces";
import { ITuple } from "@polkadot/types-codec/types";

const getFeeMarketModule = (dest: Destination): string => {
  switch (dest) {
    case Destination.Darwinia:
      return "darwiniaFeeMarket";
    case Destination.CrabParachain:
      return "crabParachainFeeMarket";
    default:
      return "feeMarket";
  }
};

/**
 * Order Create
 * https://github.com/darwinia-network/darwinia-bridges-substrate/pull/89
 */
export const handleOrderCreateEvent = async (event: SubstrateEvent, dest: Destination): Promise<void> => {
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

  // 1. save fee market entity
  const feeMarketRecord = (await FeeMarketEntity.get(dest)) || new FeeMarketEntity(dest);
  const { totalOrders = 0, totalInProgress = 0 } = feeMarketRecord;
  feeMarketRecord.totalOrders = totalOrders + 1;
  feeMarketRecord.totalInProgress = totalInProgress + 1;
  await feeMarketRecord.save();

  // 2. save relayer entity
  for (let relayer of assignedRelayers as Vec<AccountId>) {
    const id = `${dest}-${relayer.toString()}`;
    if (!(await RelayerEntity.get(id))) {
      await new RelayerEntity(id).save();
    }
  }

  // 3. save order entity
  const orderRecordId = `${dest}-${messageNonce.toString()}`;
  const orderRecord = new OrderEntity(orderRecordId);
  orderRecord.fee = (fee as Balance).toBigInt();
  orderRecord.sender = signer;
  orderRecord.slotTime = (api.consts[getFeeMarketModule(dest)].slot as u32).toNumber();
  orderRecord.outOfSlot = (outOfSlot as Option<BlockNumber>).unwrap().toNumber();
  orderRecord.phase = OrderPhase.Created;
  orderRecord.atCreated = {
    signer,
    blockTimestamp,
    blockNumber,
    extrinsicIndex,
    eventIndex,
    laneId: laneId.toString(),
  };
  orderRecord.assignedRelayers = (assignedRelayers as Vec<AccountId>).map((relayer) => relayer.toString());
  await orderRecord.save();
};

/**
 * Order Finish
 */
export const handleOrderFinishEvent = async (event: SubstrateEvent, dest: Destination): Promise<void> => {
  const {
    event: {
      data: [laneId, message],
    },
  } = event;
  const { begin, end } = message as unknown as { begin: u64; end: u64 };

  const signer = event.extrinsic.extrinsic.signer.toString();
  const blockTimestamp = event.block.timestamp;
  const blockNumber = event.block.block.header.number.toNumber();
  const extrinsicIndex = event.extrinsic.idx;
  const eventIndex = event.idx;

  for (let nonce = begin.toNumber(); nonce <= end.toNumber(); nonce++) {
    const orderRecordId = `${dest}-${nonce}`;

    const orderRecord = await OrderEntity.get(orderRecordId);
    const feeMarketRecord = await FeeMarketEntity.get(dest);

    if (!orderRecord || !feeMarketRecord) {
      continue;
    }

    const { slotTime, outOfSlot } = orderRecord;
    const { blockNumber: orderCreateBlockNumber, blockTimestamp: orderCreateTimestamp } = orderRecord.atCreated;

    orderRecord.phase = OrderPhase.Delivered;
    orderRecord.atDelivered = {
      signer,
      blockTimestamp,
      blockNumber,
      extrinsicIndex,
      eventIndex,
      laneId: laneId.toString(),
    };

    const speed = blockTimestamp.getTime() - orderCreateTimestamp.getTime();
    const { totalFinished = 0, totalOutOfSlot = 0, totalInProgress = 0, averageSpeed = speed } = feeMarketRecord;

    if (blockNumber >= outOfSlot) {
      orderRecord.confirmedSlotIndex = -1;
      feeMarketRecord.totalOutOfSlot = totalOutOfSlot + 1;
    } else {
      for (let i = 0; i < 20; i++) {
        // suppose there are at most 20 slots
        if (blockNumber <= orderCreateBlockNumber + slotTime * (i + 1)) {
          orderRecord.confirmedSlotIndex = i;
          break;
        }
      }
    }

    feeMarketRecord.totalInProgress = totalInProgress - 1;
    feeMarketRecord.totalFinished = totalFinished + 1;
    feeMarketRecord.averageSpeed = (averageSpeed + speed) / 2;

    await orderRecord.save();
    await feeMarketRecord.save();
  }
};

/**
 * Order Reward
 * https://github.com/darwinia-network/darwinia-bridges-substrate/pull/89
 */
export const handleOrderRewardEvent = async (event: SubstrateEvent, dest: Destination): Promise<void> => {
  const {
    event: {
      data: [laneId, messageNonce, rewards],
    },
  } = event;

  const { to_slot_relayer, to_message_relayer, to_confirm_relayer, to_treasury } = rewards as unknown as {
    to_slot_relayer: Option<ITuple<[AccountId, Balance]>>;
    to_message_relayer: Option<ITuple<[AccountId, Balance]>>;
    to_confirm_relayer: Option<ITuple<[AccountId, Balance]>>;
    to_treasury: Option<Balance>;
  };

  const [assigned, assignedReward] = to_slot_relayer.unwrap();
  const [delivered, deliveredReward] = to_message_relayer.unwrap();
  const [confirmed, confirmedReward] = to_confirm_relayer.unwrap();

  const assignedRelayerId = assigned.toString();
  const deliveredRelayerId = delivered.toString();
  const confirmedRelayerId = confirmed.toString();

  const assignedAmount = assignedReward.toBigInt();
  const deliveredAmount = deliveredReward.toBigInt();
  const confirmedAmount = confirmedReward.toBigInt();
  const treasuryAmount = to_treasury.unwrap().toBigInt();

  const signer = event.extrinsic.extrinsic.signer.toString();
  const blockNumber = event.block.block.header.number.toNumber();
  const blockTimestamp = event.block.timestamp;
  const extrinsicIndex = event.extrinsic.idx;
  const eventIndex = event.idx;

  const orderRecordId = `${dest}-${messageNonce.toString()}`;
  const orderRecord = await OrderEntity.get(orderRecordId);

  if (orderRecord) {
    // 1. save relayers entity
    const assignedRelayerRecordId = `${dest}-${assignedRelayerId}`;
    const deliveredRelayerRecordId = `${dest}-${deliveredRelayerId}`;
    const confirmedRelayerRecordId = `${dest}-${confirmedRelayerId}`;

    const assignedRelayerRecord =
      (await RelayerEntity.get(assignedRelayerRecordId)) || new RelayerEntity(assignedRelayerRecordId);
    const deliveredRelayerRecord =
      (await RelayerEntity.get(deliveredRelayerRecordId)) || new RelayerEntity(deliveredRelayerRecordId);
    const confirmedRelayerRecord =
      (await RelayerEntity.get(confirmedRelayerRecordId)) || new RelayerEntity(confirmedRelayerRecordId);

    assignedRelayerRecord.totalRewards = (assignedRelayerRecord.totalRewards || BigInt(0)) + assignedAmount;
    deliveredRelayerRecord.totalRewards = (deliveredRelayerRecord.totalRewards || BigInt(0)) + deliveredAmount;
    confirmedRelayerRecord.totalRewards = (confirmedRelayerRecord.totalRewards || BigInt(0)) + confirmedAmount;

    await assignedRelayerRecord.save();
    await deliveredRelayerRecord.save();
    await confirmedRelayerRecord.save();

    // 2. save reward entity
    const rewardRecordId = `${dest}-${messageNonce.toString()}`;
    const rewardRecord = new RewardEntity(rewardRecordId);
    rewardRecord.orderId = orderRecordId;
    rewardRecord.assignedRelayerId = assignedRelayerRecordId;
    rewardRecord.deliveredRelayerId = deliveredRelayerRecordId;
    rewardRecord.confirmedRelayerId = confirmedRelayerRecordId;
    rewardRecord.assignedAmount = assignedAmount;
    rewardRecord.deliveredAmount = deliveredAmount;
    rewardRecord.confirmedAmount = confirmedAmount;
    rewardRecord.treasuryAmount = treasuryAmount;
    rewardRecord.atPhase = {
      signer,
      blockTimestamp,
      blockNumber,
      extrinsicIndex,
      eventIndex,
      laneId: laneId.toString(),
    };
    await rewardRecord.save();

    // 3. save order entity
    orderRecord.assignedRelayerId = assignedRelayerRecordId;
    orderRecord.deliveredRelayerId = deliveredRelayerRecordId;
    orderRecord.confirmedRelayerId = confirmedRelayerRecordId;
    await orderRecord.save();

    // 4. save fee market entity
    const feeMarketRecord = await FeeMarketEntity.get(dest);
    feeMarketRecord.totalRewards =
      (feeMarketRecord.totalRewards || BigInt(0)) + assignedAmount + deliveredAmount + confirmedAmount;
    await feeMarketRecord.save();
  }
};

/**
 * Order Slash
 */
export const handleOrderSlashEvent = async (event: SubstrateEvent, dest: Destination): Promise<void> => {
  const {
    event: {
      data: [report],
    },
  } = event;

  const { account_id, amount, confirm_time, delay_time, lane, message, sent_time } = report as unknown as {
    account_id: AccountId32;
    amount: u128;
    confirm_time: Option<u32>;
    delay_time: Option<u32>;
    lane: U8aFixed;
    message: u64;
    sent_time: u32;
  };

  const relayerId = account_id.toString();
  const confirmTime = confirm_time.unwrap().toNumber();
  const sentTime = sent_time.toNumber();
  const delayTime = delay_time.unwrap().toNumber();
  const laneId = lane.toString();
  const nonce = message.toString();
  const slashAmount = amount.toBigInt();

  const signer = event.extrinsic.extrinsic.signer.toString();
  const blockNumber = event.block.block.header.number.toNumber();
  const blockTimestamp = event.block.timestamp;
  const extrinsicIndex = event.extrinsic.idx;
  const eventIndex = event.idx;

  const orderRecordId = `${dest}-${nonce}`;
  const relayerRecordId = `${dest}-${relayerId}`;

  const orderRecord = await OrderEntity.get(orderRecordId);
  const relayerRecord = await RelayerEntity.get(relayerRecordId);

  if (orderRecord && relayerRecord) {
    // 1. save relayer entity
    relayerRecord.totalSlashs = (relayerRecord.totalSlashs || BigInt(0)) + slashAmount;
    await relayerRecord.save();

    // 2. save slash entity
    const slashRecordId = `${dest}-${nonce}-${eventIndex}`;
    const slashRecord = new SlashEntity(slashRecordId);
    slashRecord.orderId = orderRecordId;
    slashRecord.atPhase = {
      signer,
      blockTimestamp,
      blockNumber,
      extrinsicIndex,
      eventIndex,
      laneId: laneId,
    };
    slashRecord.confirmTime = confirmTime;
    slashRecord.sentTime = sentTime;
    slashRecord.delayTime = delayTime;
    slashRecord.amount = slashAmount;
    slashRecord.relayerId = relayerRecordId;
    await slashRecord.save();

    // 3. save fee market entity
    const feeMarketRecord = (await FeeMarketEntity.get(dest)) || new FeeMarketEntity(dest);
    feeMarketRecord.totalSlashs = (feeMarketRecord.totalSlashs || BigInt(0)) + slashAmount;
    await feeMarketRecord.save();
  }
};

/**
 * Fee Update
 */
export const handleFeeUpdateEvent = async (event: SubstrateEvent, dest: Destination): Promise<void> => {
  const {
    event: {
      data: [account_id, new_fee],
    },
  } = event;

  const relayerId = (account_id as AccountId).toString();
  const newFee = (new_fee as Balance).toBigInt();

  const blockNumber = event.block.block.header.number.toNumber();
  const blockTimestamp = event.block.timestamp;
  const extrinsicIndex = event.extrinsic.idx;
  const eventIndex = event.idx;

  const relayerRecordId = `${dest}-${relayerId}`;
  const relayerRecord = (await RelayerEntity.get(relayerRecordId)) || new RelayerEntity(relayerRecordId);

  relayerRecord.feeHistory = (relayerRecord.feeHistory || []).concat([
    {
      fee: newFee,
      blockTimestamp,
      blockNumber,
      extrinsicIndex,
      eventIndex,
    },
  ]);

  await relayerRecord.save();
};
