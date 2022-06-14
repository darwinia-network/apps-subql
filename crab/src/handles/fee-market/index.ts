import { SubstrateEvent } from "@subql/types";
import { Destination, OrderPhase, FeeMarketEntity, RelayerEntity, OrderEntity } from "../../types";
import { Option, Vec, u64, u32 } from "@polkadot/types";
import { AccountId, Balance, BlockNumber } from "@polkadot/types/interfaces";
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
  const orderId = `${dest}-${messageNonce}`;
  const orderRecord = (await OrderEntity.get(orderId)) || new OrderEntity(orderId);
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
    const orderId = `${dest}-${nonce}`;

    const orderRecord = await OrderEntity.get(orderId);
    const feeMarketRecord = (await FeeMarketEntity.get(dest)) || new FeeMarketEntity(dest);

    if (!orderRecord) {
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
    const { totalFinished = 0, totalOutOfSlot = 0, averageSpeed = speed } = feeMarketRecord;

    if (blockNumber >= outOfSlot) {
      orderRecord.confirmedSlotIndex = -1;
      feeMarketRecord.totalOutOfSlot = totalOutOfSlot + 1;
    } else {
      for (let i = 0; (i = 20); i++) {
        // suppose there are at most 20 slots
        if (blockNumber <= orderCreateBlockNumber + slotTime * (i + 1)) {
          orderRecord.confirmedSlotIndex = i;
          break;
        }
      }
    }

    feeMarketRecord.totalFinished = totalFinished + 1;
    feeMarketRecord.averageSpeed = (averageSpeed + speed) / 2;

    await orderRecord.save();
    await feeMarketRecord.save();
  }
};
