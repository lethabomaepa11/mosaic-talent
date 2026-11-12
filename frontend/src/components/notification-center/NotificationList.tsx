"use client";

import { Button, Empty, List, Tag, Typography } from "antd";
import { toast } from "@/components/providers/antd-toast";
import { useNotificationAction, useNotificationState } from "@/providers/notification-provider";
import { formatDate, getNotificationUrl, severityColor, toErrorMessage } from "./helpers";
import { useStyles } from "./styles";

export const NotificationList = ({ onOpen }: { onOpen: (id: string, isRead: boolean, url: string) => Promise<void> }) => {
  const { styles } = useStyles();
  const state = useNotificationState();
  const { markNotificationAsRead } = useNotificationAction();

  if (!state.hasLoaded && state.isPending) return <Typography.Paragraph className={styles.hintText}>Loading notifications...</Typography.Paragraph>;
  if (!state.items.length) return <Empty description="No notifications yet."/>;

  return <List dataSource={state.items} renderItem={item => {
    const url = getNotificationUrl(item.data);
    return <List.Item key={item.id} actions={[
      !item.isRead ? <Button key={`read-${item.id}`} type="link" size="small" onClick={async () => {
        try { await markNotificationAsRead(item.id); }
        catch (error) { toast.error(toErrorMessage(error, "Unable to mark notification as read.")); }
      }}>Mark read</Button> : null,
      url ? <Button key={`open-${item.id}`} type="link" size="small" onClick={() => { void onOpen(item.id, item.isRead, url); }}>Open</Button> : null,
    ].filter(Boolean)}>
      <List.Item.Meta title={<Typography.Paragraph className={styles.itemMessage}>{item.message}</Typography.Paragraph>}
        description={<div className={styles.itemActions}><Tag className={styles.severityTag} color={severityColor(item.severity)}>{item.severity}</Tag><Typography.Paragraph className={styles.itemMeta}>{formatDate(item.creationTime)}</Typography.Paragraph></div>}/>
    </List.Item>;
  }}/>;
};
