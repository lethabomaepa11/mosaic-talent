"use client";
import { Alert, AutoComplete, Button, Checkbox, Form, Input, Modal, Space, Spin, Typography } from "antd";
import { BookOpenText } from "lucide-react";
import { isRepoSafetyUnsafe } from "@/utils/repoSafety";
import { useProjectRepository } from "./useProjectRepository";
import { useStyles } from "./style";

type Props = { repository: ReturnType<typeof useProjectRepository> };
export const ProjectRepositoryFields = ({ repository }: Props) => {
  const { styles } = useStyles();
  const { repoForm, isGithubLoading, isGithubStatusLoading, isRepoCreateOpen,
    setIsRepoCreateOpen, isRepoCreating, isRepoSafetyChecking, repoSafetyError,
    repoSafetyResult, isLoadingReadme, githubConnection, repoOptions, selectedGithubRepo,
    loadGithubContext, handleConnectGithub, handleCreateRepository, handleUseReadme } = repository;
  const isUnsafeRepo = isRepoSafetyUnsafe(repoSafetyResult);
  return <>
          {isGithubStatusLoading ? (
            <div className={styles.githubStatusLoader}>
              <Spin size="small" />
              <Typography.Text>Checking GitHub connection...</Typography.Text>
            </div>
          ) : !githubConnection.isConnected ? (
            <Alert
              type="info"
              title="GitHub is optional"
              description={
                <Space orientation="vertical" size={8}>
                  <Typography.Text>
                    You can create this project without a repository, or connect GitHub to link one.
                  </Typography.Text>
                  <Button onClick={handleConnectGithub}>Connect GitHub</Button>
                </Space>
              }
              showIcon
            />
          ) : (
            <div className={styles.statusRow}>
              <Form.Item
                label={`GitHub Repository (${githubConnection.githubUsername})`}
                name="githubRepo"
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      const exists = repoOptions.some((option) => option.value === value);
                      return exists
                        ? Promise.resolve()
                        : Promise.reject(new Error("Choose a repository from suggestions."));
                    },
                  },
                ]}
              >
                <AutoComplete
                  disabled={isGithubLoading}
                  options={repoOptions}
                  filterOption={(inputValue, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                  }
                  allowClear
                  placeholder="Type to find repository"
                />
              </Form.Item>

              <div className={styles.actionRow}>
                <Button onClick={() => void loadGithubContext()}>Refresh Repositories</Button>
                <Button onClick={handleConnectGithub}>Reconnect GitHub Access</Button>
                <Button onClick={() => setIsRepoCreateOpen(true)}>Create Repository</Button>
                <Button
                  icon={<BookOpenText size={14} />}
                  disabled={!selectedGithubRepo}
                  loading={isLoadingReadme}
                  onClick={() => void handleUseReadme()}
                >
                  Use README as Description
                </Button>
              </div>
              <Typography.Text type="secondary">
                If repository creation fails due permissions, reconnect GitHub and approve repository access.
              </Typography.Text>

              {isRepoSafetyChecking ? (
                <Alert type="info" showIcon title="Running repository safety scan..." />
              ) : null}
              {!isRepoSafetyChecking && repoSafetyError ? (
                <Alert type="error" showIcon title={repoSafetyError} />
              ) : null}
              {!isRepoSafetyChecking && repoSafetyResult && isUnsafeRepo ? (
                <Alert
                  type="error"
                  showIcon
                  title="Repository blocked"
                  description="This repository contains potentially malicious code and cannot be added to a project."
                />
              ) : null}
              {!isRepoSafetyChecking && repoSafetyResult && !isUnsafeRepo ? (
                <Alert
                  type="success"
                  showIcon
                  title="Repository passed safety checks"
                  description="This repository is safe to use for project creation."
                />
              ) : null}
            </div>
          )}

      <Modal
        title="Create GitHub Repository"
        open={isRepoCreateOpen}
        onCancel={() => setIsRepoCreateOpen(false)}
        onOk={handleCreateRepository}
        confirmLoading={isRepoCreating}
        okText="Create Repository"
      >
        <Form form={repoForm} layout="vertical" initialValues={{ isPrivate: false }}>
          <Form.Item
            label="Repository Name"
            name="name"
            rules={[{ required: true, message: "Repository name is required." }]}
          >
            <Input placeholder="my-awesome-project" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
          <Form.Item name="isPrivate" valuePropName="checked">
            <Checkbox>Private repository</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
  </>;
};
