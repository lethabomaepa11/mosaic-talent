"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Select,
  Spin,
  Table,
  Typography,
} from "antd";
import { toast } from "@/components/providers";
import {
  useCompanyAccountAction,
  useCompanyAccountState,
} from "@/providers/company-account-provider";
import { useCompanyProfileState } from "@/providers/company-profile-provider";
import { useTenantResolutionState } from "@/providers/tenant-provider";
import { useStyles } from "./style";

const roleOptions = [
  { label: "Admin", value: 1 },
  { label: "HR", value: 2 },
];

const roleLabel = (role: number) => (role === 1 ? "Admin" : "HR");

const EmployeesSettingsPage = () => {
  const { styles } = useStyles();
  const { tenancyName } = useTenantResolutionState();
  const { profile, isPending: profilePending } = useCompanyProfileState();
  const { employees, isPending } = useCompanyAccountState();
  const { fetchMyCompanyEmployees, addCompanyEmployee } =
    useCompanyAccountAction();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const isAdmin = profile?.role === 1;

  useEffect(() => {
    if (tenancyName && isAdmin) {
      void fetchMyCompanyEmployees();
    }
  }, [tenancyName, isAdmin]);

  const columns = useMemo(
    () => [
      {
        title: "Name",
        key: "name",
        render: (_: unknown, item: (typeof employees)[number]) =>
          `${item.name ?? ""} ${item.surname ?? ""}`.trim() || "-",
      },
      {
        title: "Username",
        dataIndex: "userName",
        key: "userName",
      },
      {
        title: "Email",
        dataIndex: "emailAddress",
        key: "emailAddress",
      },
      {
        title: "Role",
        key: "role",
        render: (_: unknown, item: (typeof employees)[number]) =>
          roleLabel(item.role),
      },
    ],
    [employees],
  );

  const handleAddEmployee = async (values: {
    name: string;
    surname: string;
    userName: string;
    emailAddress: string;
    password: string;
    role: number;
  }) => {
    setSubmitting(true);
    try {
      await addCompanyEmployee({
        name: values.name.trim(),
        surname: values.surname.trim(),
        userName: values.userName.trim(),
        emailAddress: values.emailAddress.trim(),
        password: values.password,
        role: values.role,
      });
      await fetchMyCompanyEmployees();
      form.resetFields();
      toast.success("Employee added", "New company employee created.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to add company employee.";
      toast.error("Add employee failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!tenancyName) {
    return (
      <Empty description="Employee settings are available in company workspaces only." />
    );
  }

  if (profilePending && !profile) {
    return (
      <div className={styles.loaderWrap}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Empty description="Only company admins can access Employee settings." />
    );
  }

  return (
    <div className={styles.page} data-ai-page="settings-employees">
      <div>
        <Typography.Title level={2} className={styles.title}>
          Employees
        </Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>
          Add employees and assign admin or HR role access.
        </Typography.Paragraph>
      </div>

      <div className={styles.grid}>
        <Card title="Add Employee">
          <Form
            className={styles.form}
            form={form}
            layout="vertical"
            onFinish={handleAddEmployee}
            initialValues={{ role: 2 }}
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true, message: "Name is required." }]}
            >
              <Input data-ai-field="employee-name" />
            </Form.Item>
            <Form.Item
              label="Surname"
              name="surname"
              rules={[{ required: true, message: "Surname is required." }]}
            >
              <Input data-ai-field="employee-surname" />
            </Form.Item>
            <Form.Item
              label="Username"
              name="userName"
              rules={[{ required: true, message: "Username is required." }]}
            >
              <Input data-ai-field="employee-username" />
            </Form.Item>
            <Form.Item
              label="Email"
              name="emailAddress"
              rules={[
                { required: true, message: "Email is required." },
                { type: "email", message: "Enter a valid email." },
              ]}
            >
              <Input data-ai-field="employee-email" />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Password is required." }]}
            >
              <Input.Password data-ai-field="employee-password" />
            </Form.Item>
            <Form.Item
              label="Role"
              name="role"
              rules={[{ required: true, message: "Role is required." }]}
            >
              <Select options={roleOptions} />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              data-ai-action="submit-add-employee"
            >
              Add Employee
            </Button>
          </Form>
        </Card>

        <Card title="Current Employees">
          <Table
            rowKey="id"
            loading={isPending}
            dataSource={employees}
            columns={columns}
            pagination={{ pageSize: 8 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default EmployeesSettingsPage;
