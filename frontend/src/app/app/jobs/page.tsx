"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ArrowRight, Plus } from "lucide-react";
import { toast } from "@/components/providers";
import { ICreateJobInput, IJob, IUpdateJobInput, useJobAction, useJobState } from "@/providers/job-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

const employmentTypeOptions = [
  { label: "Full Time", value: 0 },
  { label: "Part Time", value: 1 },
  { label: "Contract", value: 2 },
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
  const router = useRouter();
  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();
  const isCompanyTenant = Boolean(tenancyName);
  const { isPending, jobs } = useJobState();
  const { fetchMyJobs, createJob, updateJob, toggleJobOpenStatus } = useJobAction();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<IJob | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<ICreateJobInput>();

  useEffect(() => {
    if (isCompanyTenant) {
      void fetchMyJobs();
    }
  }, [isCompanyTenant]);

  useEffect(() => {
    if (!isCompanyTenant) {
      router.replace("/app");
    }
  }, [isCompanyTenant, router]);

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
        const input: IUpdateJobInput = { ...values, jobId: editingJob.id };
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

  if (!isCompanyTenant) {
    return null;
  }

  if (isPending && jobs.length === 0) {
    return (
      <div className={styles.pageLoader}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Typography.Title level={2} className={styles.title}>Job Postings</Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            Create and manage your company opportunities.
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<Plus size={14} />} onClick={openCreateModal}>New Job</Button>
      </div>

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
              <Link href={`/app/jobs/${job.id}`}>
                <Button type="primary" icon={<ArrowRight size={14} />}>View Applications</Button>
              </Link>
            </div>
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
