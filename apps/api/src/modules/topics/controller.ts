import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../../lib/validate";
import {
  listTopics,
  listAllTopics,
  getTopicById,
  createTopic,
  updateTopic,
  publishTopic,
  archiveTopic,
  deleteTopic,
  reorderTopics,
} from "./service";

export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const moduleId = req.query.moduleId as string | undefined;
    const topics = await listTopics(moduleId);
    res.json(topics);
  } catch (error) {
    next(error);
  }
}

export async function listAll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const topics = await listAllTopics();
    res.json(topics);
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const topic = await getTopicById(req.params.id);
    res.json(topic);
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { createTopicSchema } = await import("./schemas");
    const input = validateRequest(createTopicSchema, req.body);
    const topic = await createTopic(input);
    res.status(201).json(topic);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { updateTopicSchema } = await import("./schemas");
    const input = validateRequest(updateTopicSchema, req.body);
    const topic = await updateTopic(req.params.id, input);
    res.json(topic);
  } catch (error) {
    next(error);
  }
}

export async function publish(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const topic = await publishTopic(req.params.id);
    res.json(topic);
  } catch (error) {
    next(error);
  }
}

export async function archive(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const topic = await archiveTopic(req.params.id);
    res.json(topic);
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteTopic(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function reorder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { topicIds } = req.body;
    const { moduleId } = req.params;
    if (!Array.isArray(topicIds)) {
      res.status(400).json({ error: "topicIds must be an array" });
      return;
    }
    const topics = await reorderTopics(moduleId, topicIds);
    res.json(topics);
  } catch (error) {
    next(error);
  }
}
