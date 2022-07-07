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
        if (order) {
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

export const handleToPangoroOrderCreateEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderCreateEvent(event, Destination.Pangoro);
};

export const handleToPangolinParachainOrderCreateEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderCreateEvent(event, Destination.PangolinParachain);
};

// Order Finish

export const handleToPangoroOrderFinishEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderFinishEvent(event, Destination.Pangoro);
};

export const handleToPangolinParachainOrderFinishEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderFinishEvent(event, Destination.PangolinParachain);
};

// Order Reward

export const handleToPangoroOrderRewardEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderRewardEvent(event, Destination.Pangoro);
};

export const handleToPangolinParachainOrderRewardEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderRewardEvent(event, Destination.PangolinParachain);
};

// Order Slash

export const handleToPangoroOrderSlashEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderSlashEvent(event, Destination.Pangoro);
};

export const handleToPangolinParachainOrderSlashEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleOrderSlashEvent(event, Destination.PangolinParachain);
};

// Fee Update

export const handleToPangoroFeeUpdateEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleFeeUpdateEvent(event, Destination.Pangoro);
};

export const handleToPangolinParachainFeeUpdateEvent = async (event: SubstrateEvent): Promise<void> => {
  await handleFeeUpdateEvent(event, Destination.PangolinParachain);
};
