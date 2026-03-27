"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { Plus } from "lucide-react";
import { toast } from "@/components/providers";
import { ICreateJobInput, IJob, IUpdateJobInput, useJobAction, useJobState } from "@/providers/job-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

const employmentTypeOptions = [
  { label: "Full Time", value: 0 },
  { label: "Part Time", value: 1 },
  { label: "Contract", value: 2 },
];

const statusOptions = [
  { label: "Applied", value: 0 },
  { label: "Shortlisted", value: 1 },
  { label: "Interview", value: 2 },
  { label: "Rejected", value: 3 },
  { label: "Approved", value: 4 },
];

const toEmploymentTypeValue = (label?: string) => {
  switch ((label ?? "").toLowerCase()) {
    case "part-time":
      return 1;
    case "contract":
      return 2;
    default:
      return 0;
  }
};

const JobsPage = () => {
  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();
  const isCompanyTenant = Boolean(tenancyName);
  const { isPending, jobs, selectedJob } = useJobState();
  const {
    fetchMyJobs,
    createJob,
    updateJob,
    toggleJobOpenStatus,
    fetchJobApplications,
    updateApplicationStatus,
  } = useJobAction();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<IJob | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingApplicationsForJobId, setLoadingApplicationsForJobId] = useState<string>("");
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string>("");
  const [form] = Form.useForm<ICreateJobInput>();

  useEffect(() => {
    if (isCompanyTenant) {
      void fetchMyJobs();
    }
  }, [isCompanyTenant]);

  const selectedApplications = useMemo(() => {
    if (!selectedJob) {
      return [];
    }

    const fallback = jobs.find((item) => item.id === selectedJob.id);
    return (selectedJob.applications?.length ? selectedJob.applications : fallback?.applications) ?? [];
  }, [jobs, selectedJob]);

  const openCreateModal = () => {
    setEditingJob(null);
    form.resetFields();
    form.setFieldsValue({
      isOpen: true,
      employmentType: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (job: IJob) => {
    setEditingJob(job);
    form.setFieldsValue({
      title: job.title,
      description: job.description,
      location: job.location,
      employmentType: toEmploymentTypeValue(job.employmentType),
      isOpen: job.isOpen,
      contractDuration: job.contractDuration,
      technicalAssessmentPrompt: job.technicalAssessmentPrompt,
      behaviouralAssessmentPrompt: job.behaviouralAssessmentPrompt,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSaving(true);

    try {
      if (editingJob) {
        const input: IUpdateJobInput = {
          ...values,
          jobId: editingJob.id,
        };
        await updateJob(input);
        toast.success("Job updated", "Job posting was updated successfully.");
      } else {
        await createJob(values);
        toast.success("Job created", "New job posting is now live.");
      }
      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save job.";
      toast.error("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOpenStatus = async (job: IJob) => {
    try {
      await toggleJobOpenStatus(job.id, !job.isOpen);
      toast.success("Job updated", `Job is now ${job.isOpen ? "closed" : "open"}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update status.";
      toast.error("Update failed", message);
    }
  };

  const handleLoadApplications = async (jobId: string) => {
    setLoadingApplicationsForJobId(jobId);
    try {
      await fetchJobApplications(jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load applications.";
      toast.error("Load failed", message);
    } finally {
      setLoadingApplicationsForJobId("");
    }
  };

  const handleApplicationStatusChange = async (applicationId: string, status: number) => {
    setUpdatingApplicationId(applicationId);
    try {
      await updateApplicationStatus(applicationId, status);
      toast.success("Status updated", "Application status changed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update status.";
      toast.error("Update failed", message);
    } finally {
      setUpdatingApplicationId("");
    }
  };

  if (!isCompanyTenant) {
    return <Empty description="Jobs are only available in company workspaces." />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Typography.Title level={2} className={styles.title}>
            Job Postings
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            Create and manage your company opportunities.
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<Plus size={14} />} onClick={openCreateModal}>
          New Job
        </Button>
      </div>

      {isPending && jobs.length === 0 ? <Spin /> : null}
      {!isPending && jobs.length === 0 ? <Empty description="No jobs yet. Create your first posting." /> : null}

      <div className={styles.list}>
        {jobs.map((job) => (
          <Card key={job.id}>
            <div className={styles.cardHeader}>
              <div>
                <Typography.Title level={4}>{job.title}</Typography.Title>
                <Typography.Paragraph className={styles.cardMeta}>
                  {job.location} • {job.employmentType}
                  {job.contractDuration ? ` • ${job.contractDuration} months` : ""}
                </Typography.Paragraph>
              </div>
              <Space wrap>
                <Tag color={job.isOpen ? "green" : "red"}>{job.isOpen ? "Open" : "Closed"}</Tag>
                <Tag>{job.applicationCount} applications</Tag>
              </Space>
            </div>

            <Typography.Paragraph>{job.description}</Typography.Paragraph>

            <div className={styles.cardActions}>
              <Button onClick={() => openEditModal(job)}>Edit</Button>
              <Button onClick={() => void handleToggleOpenStatus(job)}>
                {job.isOpen ? "Close Job" : "Reopen Job"}
              </Button>
              <Button
                onClick={() => void handleLoadApplications(job.id)}
                loading={loadingApplicationsForJobId === job.id}
              >
                View Applications
              </Button>
            </div>

            {selectedJob?.id === job.id && selectedApplications.length > 0 ? (
              <Space direction="vertical" size={8} style={{ marginTop: 16, width: "100%" }}>
                {selectedApplications.map((application) => (
                  <div key={application.id} className={styles.applicationItem}>
                    <Typography.Text strong>{application.candidateName}</Typography.Text>
                    <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                      {application.candidateEmail}
                    </Typography.Paragraph>
                    <Typography.Paragraph style={{ marginBottom: 8 }}>
                      Match: {application.matchScore.toFixed(1)}% • {application.matchReason}
                    </Typography.Paragraph>
                    <Space wrap>
                      <Tag>{application.source}</Tag>
                      <Select
                        value={statusOptions.find((option) => option.label.toLowerCase() === application.status)?.value ?? 0}
                        options={statusOptions}
                        style={{ width: 170 }}
                        loading={updatingApplicationId === application.id}
                        onChange={(value) => void handleApplicationStatusChange(application.id, value)}
                      />
                    </Space>
                  </div>
                ))}
              </Space>
            ) : null}
          </Card>
        ))}
      </div>

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => void handleSubmit()}
        confirmLoading={saving}
        title={editingJob ? "Edit Job" : "Create Job"}
      >
        <Form layout="vertical" form={form}>
          <div className={styles.modalGrid}>
            <Form.Item name="title" label="Title" className={styles.fullSpan} rules={[{ required: true }]}>
              <Input placeholder="Frontend Engineer" />
            </Form.Item>

            <Form.Item name="location" label="Location" rules={[{ required: true }]}>
              <Input placeholder="Johannesburg / Remote" />
            </Form.Item>

            <Form.Item name="employmentType" label="Employment Type" rules={[{ required: true }]}>
              <Select options={employmentTypeOptions} />
            </Form.Item>

            <Form.Item name="contractDuration" label="Contract Duration (Months)">
              <InputNumber min={1} max={60} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="isOpen" label="Open Status">
              <Select options={[{ label: "Open", value: true }, { label: "Closed", value: false }]} />
            </Form.Item>

            <Form.Item name="description" label="Description" className={styles.fullSpan} rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="Role summary and responsibilities." />
            </Form.Item>

            <Form.Item name="technicalAssessmentPrompt" label="Technical Assessment Prompt" className={styles.fullSpan}>
              <Input.TextArea rows={3} placeholder="Prompt for technical assessment." />
            </Form.Item>

            <Form.Item name="behaviouralAssessmentPrompt" label="Behavioural Assessment Prompt" className={styles.fullSpan}>
              <Input.TextArea rows={3} placeholder="Prompt for behavioural assessment." />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default JobsPage;
