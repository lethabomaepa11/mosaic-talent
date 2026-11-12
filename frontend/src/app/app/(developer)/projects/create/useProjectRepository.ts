"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form, type FormInstance } from "antd";
import { toast } from "@/components/providers";
import { useProjectAction } from "@/providers/project-provider";
import { useAuthAction } from "@/providers/auth-provider";
import type { IRepoSafetyResult } from "@/providers/project-provider/context";

export const useProjectRepository = (form: FormInstance, enabled: boolean) => {
  const [repoForm] = Form.useForm();
  const lastAutofilledTitle = useRef("");
  const { beginGithubConnection } = useAuthAction();
  const { getGithubConnectionStatus, getMyGithubRepositories, createGithubRepository,
    getRepositoryReadme, scanRepoSafetyByGithubUrl } = useProjectAction();
  const selectedGithubRepo = Form.useWatch("githubRepo", form);
  const [isLoadingReadme, setIsLoadingReadme] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGithubStatusLoading, setIsGithubStatusLoading] = useState(false);
  const [isRepoCreateOpen, setIsRepoCreateOpen] = useState(false);
  const [isRepoCreating, setIsRepoCreating] = useState(false);
  const [isRepoSafetyChecking, setIsRepoSafetyChecking] = useState(false);
  const [repoSafetyError, setRepoSafetyError] = useState("");
  const [repoSafetyResult, setRepoSafetyResult] = useState<IRepoSafetyResult | undefined>(
    undefined,
  );
  const [githubConnection, setGithubConnection] = useState({
    isConnected: false,
    githubUsername: "",
  });
  const [githubRepos, setGithubRepos] = useState<
    Array<{
      fullName: string;
      name: string;
      isPrivate: boolean;
    }>
  >([]);

  const repoOptions = useMemo(
    () =>
      githubRepos.map((repo) => {
        const repoKey = repo.fullName || repo.name;
        return {
          value: repoKey,
          label: `${repoKey}${repo.isPrivate ? " (private)" : ""}`,
        };
      }),
    [githubRepos],
  );

  const resolveSelectedRepoUrl = useCallback(
    (value: string) => {
      const selected = githubRepos.find((repo) => {
        const repoKey = repo.fullName || repo.name;
        return repoKey === value;
      });

      if (selected?.fullName) {
        return `https://github.com/${selected.fullName}`;
      }

      return value.startsWith("https://github.com/") ? value : "";
    },
    [githubRepos],
  );

  const loadGithubContext = async () => {
    setIsGithubLoading(true);
    setIsGithubStatusLoading(true);

    try {
      const status = await getGithubConnectionStatus();
      setGithubConnection(status);
      setIsGithubStatusLoading(false);

      if (!status.isConnected) {
        setGithubRepos([]);
        form.setFieldValue("githubRepo", undefined);
        setRepoSafetyResult(undefined);
        setRepoSafetyError("");
        return;
      }

      const repositories = await getMyGithubRepositories();
      setGithubRepos(repositories);
    } catch (error) {
      setIsGithubStatusLoading(false);
      const message =
        error instanceof Error ? error.message : "Failed to load GitHub context.";
      toast.error("GitHub unavailable", message);
    } finally {
      setIsGithubLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) void loadGithubContext();
  }, [enabled]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isGithubConnected = params.get("githubConnected");
    const githubConnectError = params.get("githubConnectError");
    if (isGithubConnected === "1") {
      toast.success("GitHub connected", "Your GitHub account is now connected.");
      void loadGithubContext();
    }
    if (isGithubConnected === "0" && githubConnectError) {
      toast.error("GitHub connect failed", githubConnectError);
    }

    if (isGithubConnected !== null || githubConnectError !== null) {
      params.delete("githubConnected");
      params.delete("githubConnectError");
      const query = params.toString();
      const nextUrl = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      window.history.replaceState({}, "", nextUrl);
    }
  }, []);

  useEffect(() => {
    const selectedRepo = githubRepos.find((repo) => (repo.fullName || repo.name) === selectedGithubRepo);
    if (!selectedRepo) {
      lastAutofilledTitle.current = "";
      return;
    }

    const currentTitle = String(form.getFieldValue("title") ?? "").trim();
    if (!currentTitle || currentTitle === lastAutofilledTitle.current) {
      form.setFieldValue("title", selectedRepo.name);
      lastAutofilledTitle.current = selectedRepo.name;
    }
  }, [selectedGithubRepo, githubRepos, form]);

  useEffect(() => {
    if (!githubConnection.isConnected || !selectedGithubRepo) {
      setRepoSafetyResult(undefined);
      setRepoSafetyError("");
      setIsRepoSafetyChecking(false);
      return;
    }

    const selectedUrl = resolveSelectedRepoUrl(String(selectedGithubRepo));
    if (!selectedUrl) {
      setRepoSafetyResult(undefined);
      setRepoSafetyError("Select a repository from the list to run safety checks.");
      return;
    }

    let isActive = true;
    setIsRepoSafetyChecking(true);
    setRepoSafetyError("");
    setRepoSafetyResult(undefined);

    scanRepoSafetyByGithubUrl(selectedUrl)
      .then((scan) => {
        if (!isActive) {
          return;
        }

        setRepoSafetyResult(scan?.result);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setRepoSafetyResult(undefined);
        setRepoSafetyError(
          error instanceof Error ? error.message : "Repository safety scan failed.",
        );
      })
      .finally(() => {
        if (isActive) {
          setIsRepoSafetyChecking(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedGithubRepo, githubConnection.isConnected]);

  const handleConnectGithub = async () => {
    try {
      const url = await beginGithubConnection("/app/projects/create");
      window.location.assign(url);
    } catch {
      toast.error("GitHub unavailable", "You can continue without GitHub and try connecting again later.");
    }
  };

  const handleCreateRepository = async () => {
    try {
      const values = await repoForm.validateFields();
      setIsRepoCreating(true);
      const created = await createGithubRepository({
        name: values.name,
        description: values.description,
        isPrivate: Boolean(values.isPrivate),
      });

      await loadGithubContext();
      if (created) {
        form.setFieldValue("githubRepo", created.fullName || created.name);
      }
      repoForm.resetFields();
      setIsRepoCreateOpen(false);
      toast.success("Repository created", "New GitHub repository is ready.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create GitHub repository.";
      toast.error("Repository creation failed", message);
    } finally {
      setIsRepoCreating(false);
    }
  };

  const handleUseReadme = async () => {
    const repoKey = String(form.getFieldValue("githubRepo") ?? "");
    if (!repoKey) {
      toast.error("Select repository", "Choose a repository first.");
      return;
    }

    setIsLoadingReadme(true);
    try {
      const readme = await getRepositoryReadme(repoKey);
      if (!readme?.content) {
        throw new Error("README was empty.");
      }

      form.setFieldValue("description", readme.content);
      toast.success("README copied", "Project description has been filled from README.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load README content.";
      toast.error("README load failed", message);
    } finally {
      setIsLoadingReadme(false);
    }
  };

  return { repoForm, isGithubLoading, isGithubStatusLoading, isRepoCreateOpen,
    setIsRepoCreateOpen, isRepoCreating, isRepoSafetyChecking, repoSafetyError,
    repoSafetyResult, isLoadingReadme, githubConnection, repoOptions, selectedGithubRepo,
    resolveSelectedRepoUrl, loadGithubContext, handleConnectGithub,
    handleCreateRepository, handleUseReadme };
};
