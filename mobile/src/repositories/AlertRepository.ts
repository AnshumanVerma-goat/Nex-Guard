import { getDatabase } from '../database/database';
import { FallEventEntity, FallEventRepository } from './FallEventRepository';

export type AlertEntity = {
  id: string;
  fall_event_id: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledged_by_id: string | null;
  acknowledged_at: string | null;
  resolved_by_id: string | null;
  resolved_at: string | null;
  notes: string | null;
  created_at: string;
};

export type AlertWithEvent = AlertEntity & {
  fall_event: FallEventEntity | null;
};

export const AlertRepository = {
  async createAlert(alert: AlertEntity): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO alerts (id, fall_event_id, status, acknowledged_by_id, acknowledged_at, resolved_by_id, resolved_at, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        alert.id,
        alert.fall_event_id,
        alert.status,
        alert.acknowledged_by_id,
        alert.acknowledged_at,
        alert.resolved_by_id,
        alert.resolved_at,
        alert.notes,
        alert.created_at,
      ]
    );
  },

  async updateStatus(
    id: string,
    status: 'ACKNOWLEDGED' | 'RESOLVED',
    byUserId: string | null,
    timestamp: string,
    notes: string | null
  ): Promise<void> {
    const db = await getDatabase();
    if (status === 'ACKNOWLEDGED') {
      await db.runAsync(
        `UPDATE alerts SET status = ?, acknowledged_by_id = ?, acknowledged_at = ?, notes = ? WHERE id = ?;`,
        [status, byUserId, timestamp, notes, id]
      );
    } else {
      await db.runAsync(
        `UPDATE alerts SET status = ?, resolved_by_id = ?, resolved_at = ?, notes = ? WHERE id = ?;`,
        [status, byUserId, timestamp, notes, id]
      );
    }
  },

  async getAllAlerts(): Promise<AlertWithEvent[]> {
    const db = await getDatabase();
    const rawAlerts = await db.getAllAsync<AlertEntity>(`SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100;`);
    const alertsWithEvents: AlertWithEvent[] = [];

    for (const a of rawAlerts) {
      const fe = await FallEventRepository.findById(a.fall_event_id);
      alertsWithEvents.push({ ...a, fall_event: fe });
    }

    return alertsWithEvents;
  },

  async findById(id: string): Promise<AlertWithEvent | null> {
    const db = await getDatabase();
    const a = await db.getFirstAsync<AlertEntity>(`SELECT * FROM alerts WHERE id = ?;`, [id]);
    if (!a) return null;
    const fe = await FallEventRepository.findById(a.fall_event_id);
    return { ...a, fall_event: fe };
  },
};
