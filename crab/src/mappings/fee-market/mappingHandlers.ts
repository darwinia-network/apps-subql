import { SubstrateEvent, SubstrateBlock } from "@subql/types";
import { Destination, FeeMarketEntity, OrderEntity, OrderStatus } from "../../types";
import {
  handleOrderCreateEvent,
  handleOrderFinishEvent,
  handleOrderRewardEvent,
  handleOrderSlashEvent,
  handleFeeUpdateEvent,
} from "../../handlers/fee-market";

const updateOutOfSlot = async (current: number, dest: Destination) => {
  const feeMarket = await FeeMarketEntity.get(dest);

  if (feeMarket) {
    const msgs = feeMarket.unfinishOrders || [];

    for (let msg of msgs) {
      if (current >= msg.outOfSlot) {
        const order = await OrderEntity.get(`${dest}-${msg.nonce}`);
        if (order && order.status === OrderStatus.InProgress) {
          order.status = OrderStatus.OutOfSlot;
          await order.save();

          feeMarket.totalOutOfSlot = (feeMarket.totalOutOfSlot || 0) + 1;
          feeMarket.totalInProgress = (feeMarket.totalInProgress || 0) - 1;
        }
      }
    }

    await feeMarket.save();
  }
};

export const handleBlock = async (block: SubstrateBlock): Promise<void> => {
  const destinations = Object.values(Destination);
  const current = block.block.header.number.toNumber();

  for (const destination of destinations) {
    await updateOutOfSlot(current, destination);
  }
};

// Order Create

export const handleToDarwiniaOrderCreateEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderCreateEvent(event, Destination.Darwinia);
};

export const handleToCrabParachainOrderCreateEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderCreateEvent(event, Destination.CrabParachain);
};

// Order Finish

export const handleToDarwiniaOrderFinishEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderFinishEvent(event, Destination.Darwinia);
};

export const handleToCrabParachainOrderFinishEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderFinishEvent(event, Destination.CrabParachain);
};

// Order Reward

export const handleToDarwiniaOrderRewardEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderRewardEvent(event, Destination.Darwinia);
};

export const handleToCrabParachainOrderRewardEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderRewardEvent(event, Destination.CrabParachain);
};

// Order Slash

export const handleToDarwiniaOrderSlashEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderSlashEvent(event, Destination.Darwinia);
};

export const handleToCrabParachainOrderSlashEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderSlashEvent(event, Destination.CrabParachain);
};

// Fee Update

export const handleToDarwiniaFeeUpdateEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleFeeUpdateEvent(event, Destination.Darwinia);
};

export const handleToCrabParachainFeeUpdateEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleFeeUpdateEvent(event, Destination.CrabParachain);
};
