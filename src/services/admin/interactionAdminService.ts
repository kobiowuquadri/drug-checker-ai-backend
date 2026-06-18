import { Op } from "sequelize";
import DrugInteraction, { DrugInteractionCreationAttributes } from "../../schemas/interactions/drugInteractionSchema.js";
import { BAD_REQUEST, CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, SUCCESS } from "../../constants/statusCode.js";
import { messageHandler } from "../../utils/index.js";
import { BaseResponse } from "../../types/users/auth.js";

export const createInteractionRecordService = async (
  data: DrugInteractionCreationAttributes,
  callback: (data: BaseResponse) => void
) => {
  try {
    const existingInteraction = await DrugInteraction.findOne({
      where: {
        [Op.or]: [
          { drugARxcui: data.drugARxcui, drugBRxcui: data.drugBRxcui },
          { drugARxcui: data.drugBRxcui, drugBRxcui: data.drugARxcui },
        ],
      },
    });

    if (existingInteraction) {
      return callback(messageHandler("Interaction record already exists", false, CONFLICT, existingInteraction));
    }

    const interaction = await DrugInteraction.create(data);

    return callback(messageHandler("Interaction record created successfully", true, SUCCESS, interaction));
  } catch (error) {
    return callback(messageHandler("An error occured while creating interaction record.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getInteractionRecordsService = async (callback: (data: BaseResponse) => void) => {
  try {
    const interactions = await DrugInteraction.findAll({
      order: [["createdAt", "DESC"]],
    });

    return callback(messageHandler("Interaction records fetched successfully", true, SUCCESS, interactions));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching interaction records.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getInteractionRecordService = async (id: number, callback: (data: BaseResponse) => void) => {
  try {
    if (!id) {
      return callback(messageHandler("Interaction record id is required", false, BAD_REQUEST, {}));
    }

    const interaction = await DrugInteraction.findByPk(id);
    if (!interaction) {
      return callback(messageHandler("Interaction record not found", false, NOT_FOUND, {}));
    }

    return callback(messageHandler("Interaction record fetched successfully", true, SUCCESS, interaction));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching interaction record.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const updateInteractionRecordService = async (
  id: number,
  data: Partial<DrugInteractionCreationAttributes>,
  callback: (data: BaseResponse) => void
) => {
  try {
    const interaction = await DrugInteraction.findByPk(id);
    if (!interaction) {
      return callback(messageHandler("Interaction record not found", false, NOT_FOUND, {}));
    }

    await interaction.update({
      ...data,
      updatedAt: new Date(),
    });

    return callback(messageHandler("Interaction record updated successfully", true, SUCCESS, interaction));
  } catch (error) {
    return callback(messageHandler("An error occured while updating interaction record.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const deleteInteractionRecordService = async (id: number, callback: (data: BaseResponse) => void) => {
  try {
    const interaction = await DrugInteraction.findByPk(id);
    if (!interaction) {
      return callback(messageHandler("Interaction record not found", false, NOT_FOUND, {}));
    }

    await interaction.destroy();

    return callback(messageHandler("Interaction record deleted successfully", true, SUCCESS, {}));
  } catch (error) {
    return callback(messageHandler("An error occured while deleting interaction record.", false, INTERNAL_SERVER_ERROR, error));
  }
};
