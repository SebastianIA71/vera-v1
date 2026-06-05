import { db } from '@/lib/db';
import { tasks, inbox } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import TaskDetailClient from './TaskDetailClient';

export const dynamic = 'force-dynamic';

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = parseInt(id, 10);
  if (isNaN(taskId)) notFound();

  const [taskRows, inboxItems] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1),
    db.select({ id: inbox.id }).from(inbox).where(eq(inbox.processed, false)),
  ]);

  const task = taskRows[0];
  if (!task) notFound();

  return <TaskDetailClient task={task} inboxCount={inboxItems.length} />;
}
