import { SubstrateEvent, SubstrateBlock } from "@subql/types";
import { Destination, InProgressOrderEntity } from "../../types";
import {
  handleOrderCreateEvent,
  handleOrderFinishEvent,
  handleOrderRewardEvent,
  handleOrderSlashEvent,
  handleFeeUpdateEvent,
} from "../../handlers/fee-market";

export const handleBlock = async (block: SubstrateBlock): Promise<void> => {
  const current = block.block.header.number.toNumber();
  const records = (await InProgressOrderEntity.getByIsOutOfSlot(false)) || [];

  for (let record of records) {
    if (record.outOfSlotBlock >= current) {
      record.isOutOfSlot = true;
      await record.save();
    }
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
