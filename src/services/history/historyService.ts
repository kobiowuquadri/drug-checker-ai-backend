import InteractionHistory from "../../schemas/history/interactionHistorySchema.js";
import { CreateHistoryRequest, HistoryResponse } from "../../types/history/history.js";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, SUCCESS } from "../../constants/statusCode.js";
import { messageHandler } from "../../utils/index.js";

export const createHistoryService = async (
  userId: number,
  data: CreateHistoryRequest,
  callback: (data: HistoryResponse) => void
) => {
  try {
    if (!data.selectedDrugs || data.selectedDrugs.length < 2 || data.selectedDrugs.length > 5) {
      return callback(messageHandler("Selected drugs must contain 2 to 5 drugs", false, BAD_REQUEST, {}));
    }

    const history = await InteractionHistory.create({
      userId,
      selectedDrugs: data.selectedDrugs,
      results: data.results || [],
    });

    return callback(messageHandler("Interaction history created successfully", true, SUCCESS, history));
  } catch (error) {
    return callback(messageHandler("An error occured while creating interaction history.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getHistoriesService = async (userId: number, callback: (data: HistoryResponse) => void) => {
  try {
    const histories = await InteractionHistory.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    return callback(messageHandler("Interaction histories fetched successfully", true, SUCCESS, histories));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching interaction histories.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getHistoryService = async (userId: number, historyId: number, callback: (data: HistoryResponse) => void) => {
  try {
    const history = await InteractionHistory.findOne({ where: { id: historyId, userId } });
    if (!history) {
      return callback(messageHandler("Interaction history not found", false, NOT_FOUND, {}));
    }

    return callback(messageHandler("Interaction history fetched successfully", true, SUCCESS, history));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching interaction history.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const deleteHistoryService = async (userId: number, historyId: number, callback: (data: HistoryResponse) => void) => {
  try {
    const history = await InteractionHistory.findOne({ where: { id: historyId, userId } });
    if (!history) {
      return callback(messageHandler("Interaction history not found", false, NOT_FOUND, {}));
    }

    await history.destroy();

    return callback(messageHandler("Interaction history deleted successfully", true, SUCCESS, {}));
  } catch (error) {
    return callback(messageHandler("An error occured while deleting interaction history.", false, INTERNAL_SERVER_ERROR, error));
  }
};
