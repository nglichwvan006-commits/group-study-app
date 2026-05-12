import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.globalSetting.findMany();
    // Convert array to object for easier consumption
    const settingsMap = settings.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ message: "Error fetching settings" });
  }
};

export const updateSetting = async (req: Request, res: Response) => {
  const { key, value } = req.body;

  if (!key) return res.status(400).json({ message: "Key is required" });

  try {
    const setting = await prisma.globalSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: "Error updating setting" });
  }
};
