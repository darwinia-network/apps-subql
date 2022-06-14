import { SubstrateEvent } from "@subql/types";
import { Destination } from "../../types";
import {
  handleOrderCreateEvent,
  handleOrderFinishEvent,
  handleOrderRewardEvent,
  handleOrderSlashEvent,
  handleFeeUpdateEvent,
} from "../../handles/fee-market";

// Order Create

export const handleToDarwiniaOrderCreateEvent = async (event: SubstrateEvent): Promise<void> => {
  handleOrderCreateEvent(event, Destination.Darwinia);
};

export const handleToCrabParachainOrderCreateEvent = async (event: SubstrateEvent): Promise<void> => {
  handleOrderCreateEvent(event, Destination.CrabParachain);
};

// Order Finish

export const handleToDarwiniaOrderFinishEvent = async (event: SubstrateEvent): Promise<void> => {
  handleOrderFinishEvent(event, Destination.Darwinia);
};

export const handleToCrabParachainOrderFinishEvent = async (event: SubstrateEvent): Promise<void> => {
  handleOrderFinishEvent(event, Destination.CrabParachain);
};

// Order Reward

export const handleToDarwiniaOrderRewardEvent = async (event: SubstrateEvent): Promise<void> => {
  handleOrderRewardEvent(event, Destination.Darwinia);
};

export const handleToCrabParachainOrderRewardEvent = async (event: SubstrateEvent): Promise<void> => {
  handleOrderRewardEvent(event, Destination.CrabParachain);
};

// Order Slash

export const handleToDarwiniaOrderSlashEvent = async (event: SubstrateEvent): Promise<void> => {
  handleOrderSlashEvent(event, Destination.Darwinia);
};

export const handleToCrabParachainOrderSlashEvent = async (event: SubstrateEvent): Promise<void> => {
  handleOrderSlashEvent(event, Destination.CrabParachain);
};

// Fee Update

export const handleToDarwiniaFeeUpdateEvent = async (event: SubstrateEvent): Promise<void> => {
  handleFeeUpdateEvent(event, Destination.Darwinia);
};

export const handleToCrabParachainFeeUpdateEvent = async (event: SubstrateEvent): Promise<void> => {
  handleFeeUpdateEvent(event, Destination.CrabParachain);
};
