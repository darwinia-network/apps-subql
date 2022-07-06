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
