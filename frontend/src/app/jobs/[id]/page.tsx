"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Briefcase, MapPin } from "lucide-react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { toast } from "@/components/providers";
import { useJobAction, useJobState } from "@/providers/job-provider";
import { uploadPublicFile } from "@/utils/fileUpload";
import { useStyles } from "./style";

interface IApplicationField {
  key: string;
  label: string;
  type: "text" | "textarea" | "email" | "number";
  required?: boolean;
  placeholder?: string;
}

const normalizeFieldToken = (value?: string) => {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
};

const isCoreField = (field: IApplicationField) => {
  const key = normalizeFieldToken(field.key);
  const label = normalizeFieldToken(field.label);
  const tokens = [key, label];

  const coreTokens = [
    "fullname",
    "name",
    "email",
    "emailaddress",
    "phonenumber",
    "phone",
    "mobile",
    "resume",
    "uploadresume",
    "resumestoredfileid",
    "resumeurl",
  ];

  return tokens.some((token) => coreTokens.includes(token));
};

const JobApplyPage = () => {
  const params = useParams<{ id: string }>();
  const jobId = String(params?.id ?? "");
  const { styles } = useStyles();
  const [form] = Form.useForm();
  const { jobs, isPending, publicJobsPage } = useJobState();
  const { fetchOpenJobs, fetchPublicJobsPage, applyToPublicJob } = useJobAction();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadedResumeName, setUploadedResumeName] = useState("");

  useEffect(() => {
    void fetchOpenJobs();
    void fetchPublicJobsPage();
  }, []);

  const selectedJob = useMemo(() => jobs.find((job) => job.id === jobId), [jobs, jobId]);

  const applicationFields = useMemo(() => {
    if (!publicJobsPage?.applicationFormJson) {
      return [] as IApplicationField[];
    }

    try {
      const parsed = JSON.parse(publicJobsPage.applicationFormJson) as {
        fields?: IApplicationField[];
      };
      return Array.isArray(parsed.fields) ? parsed.fields : [];
    } catch {
      return [] as IApplicationField[];
    }
  }, [publicJobsPage?.applicationFormJson]);

  const customFields = useMemo(() => {
    return applicationFields.filter((field) => !isCoreField(field));
  }, [applicationFields]);

  const handleApply = async () => {
    if (!selectedJob) {
      return;
    }

    const values = await form.validateFields();
    if (!values.resumeStoredFileId) {
      toast.error("Resume required", "Please upload your CV before applying.");
      return;
    }
    const responses = customFields.reduce<Record<string, string>>((acc, field) => {
      const value = values[field.key];
      if (typeof value === "string" && value.trim().length > 0) {
        acc[field.key] = value;
      }
      return acc;
    }, {});

    setSubmitting(true);
    try {
      await applyToPublicJob({
        jobId: selectedJob.id,
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        resumeStoredFileId: values.resumeStoredFileId,
        technicalAssessmentAnswer:
          values.technicalAssessmentAnswer || responses.technicalAssessmentAnswer,
        behaviouralAssessmentAnswer:
          values.behaviouralAssessmentAnswer || responses.behaviouralAssessmentAnswer,
        responsesJson: JSON.stringify(responses),
        source: 5,
      });
      toast.success("Application submitted", "Your application was sent successfully.");
      form.resetFields();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not apply to this job.";
      toast.error("Apply failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    setUploadingResume(true);
    try {
      const uploaded = await uploadPublicFile(file, "job-resumes");
      form.setFieldValue("resumeStoredFileId", uploaded.url);
      setUploadedResumeName(file.name);
      toast.success("Resume uploaded", "Your resume was uploaded successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload resume.";
      toast.error("Upload failed", message);
    } finally {
      setUploadingResume(false);
    }
  };

  if (!isPending && !selectedJob) {
    return (
      <div className={styles.page}>
        <Empty description="Job not found or no longer open.">
          <Link href="/jobs">
            <Button>Back to jobs</Button>
          </Link>
        </Empty>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/jobs">
        <Button icon={<ArrowLeft size={14} />}>Back to jobs</Button>
      </Link>

      {isPending || !selectedJob ? (
        <Spin />
      ) : (
        <>
          <div className={styles.header}>
            <Typography.Title level={2} className={styles.title}>
              {selectedJob.title}
            </Typography.Title>
            <div className={styles.metaRow}>
              <span>
                <MapPin size={14} /> {selectedJob.location}
              </span>
              <span>
                <Briefcase size={14} /> {selectedJob.employmentType}
              </span>
              <Tag color={selectedJob.isOpen ? "green" : "default"}>
                {selectedJob.isOpen ? "Open" : "Closed"}
              </Tag>
            </div>
            <Typography.Paragraph className={styles.subtitle}>
              {selectedJob.description}
            </Typography.Paragraph>
          </div>

          <Card>
            <Typography.Title level={4}>Apply for this role</Typography.Title>
            <Typography.Paragraph className={styles.subtitle}>
              Complete the form below. You do not need an account to apply.
            </Typography.Paragraph>
            <Form layout="vertical" form={form} className={styles.formGrid}>
              <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                <Input placeholder="Your full name" />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, type: "email" }]}
              >
                <Input placeholder="you@example.com" />
              </Form.Item>
              <Form.Item name="phoneNumber" label="Phone Number">
                <Input placeholder="+27..." />
              </Form.Item>
              <Form.Item name="resumeStoredFileId" hidden>
                <Input />
              </Form.Item>
              <Form.Item label="Upload Resume">
                <div className={styles.resumeUploadRow}>
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => {
                      void handleResumeUpload(file as File);
                      return false;
                    }}
                  >
                    <Button loading={uploadingResume} icon={<UploadOutlined />}>
                      Upload Resume
                    </Button>
                  </Upload>
                  {uploadedResumeName ? (
                    <Typography.Text className={styles.resumeName}>
                      {uploadedResumeName}
                    </Typography.Text>
                  ) : (
                    <Typography.Text className={styles.resumeHint}>
                      PDF or document file
                    </Typography.Text>
                  )}
                </div>
              </Form.Item>

              {customFields.map((field) => (
                <Form.Item
                  key={field.key}
                  name={field.key}
                  label={field.label}
                  className={styles.fullSpan}
                  rules={
                    field.required
                      ? [{ required: true, message: `${field.label} is required.` }]
                      : undefined
                  }
                >
                  {field.type === "textarea" ? (
                    <Input.TextArea rows={4} placeholder={field.placeholder || ""} />
                  ) : (
                    <Input
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "email"
                            ? "email"
                            : "text"
                      }
                      placeholder={field.placeholder || ""}
                    />
                  )}
                </Form.Item>
              ))}

              <div className={styles.actions}>
                <Space>
                  <Link href="/jobs">
                    <Button>Cancel</Button>
                  </Link>
                  <Button type="primary" loading={submitting} onClick={() => void handleApply()}>
                    Submit Application
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </>
      )}
    </div>
  );
};

export default JobApplyPage;
