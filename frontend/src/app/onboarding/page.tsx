"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Input, InputNumber, Select, Slider, Upload } from "antd";
import { toast } from "@/components/providers";
import {
  useDeveloperAction,
  useDeveloperState,
} from "@/providers/developer-provider";
import { useAuthState } from "@/providers/auth-provider";
import { uploadFile } from "@/utils/fileUpload";
import { useStyles } from "./style";

const OnboardingPage = () => {
  const [githubUsername, setGithubUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<
    number | undefined
  >(undefined);
  const [yearOfStudy, setYearOfStudy] = useState<number | undefined>(undefined);
  const [studyLevel, setStudyLevel] = useState(0);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [teamworkRating, setTeamworkRating] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const router = useRouter();
  const { styles } = useStyles();
  const { isAuthenticated } = useAuthState();
  const { isError, isSuccess, isPending, profile, studyLevels } =
    useDeveloperState();
  const { fetchMyProfile, fetchStudyLevels, upsertMyProfile } =
    useDeveloperAction();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    fetchMyProfile();
    fetchStudyLevels();
  }, []);

  useEffect(() => {
    setGithubUsername(profile.githubUsername ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");
    setYearsOfExperience(profile.yearsOfExperience);
    setYearOfStudy(profile.yearOfStudy);
    setStudyLevel(profile.studyLevel ?? 0);
    setBio(profile.bio ?? "");
    setLocation(profile.location ?? "");
    setTeamworkRating(profile.teamworkRating ?? 0);
    setSkills(profile.skills ?? []);
    setGoals(profile.goals ?? []);
  }, [profile]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!githubUsername) {
      toast.error(
        "Missing GitHub username",
        "Please provide a GitHub username.",
      );
      return;
    }

    if (yearOfStudy !== undefined && yearOfStudy >= 10) {
      toast.error("Invalid year of study", "Year of study must be below 10.");
      return;
    }

    setIsSubmitting(true);

    try {
      await upsertMyProfile({
        githubUsername,
        avatarUrl,
        yearsOfExperience,
        yearOfStudy,
        studyLevel,
        bio,
        location,
        teamworkRating,
        skills,
        goals,
      });
      toast.success("Profile saved", "Your onboarding details are updated.");
      router.push("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);

    try {
      const uploaded = await uploadFile(file, "avatars");
      setAvatarUrl(uploaded.url);
      toast.success("Avatar uploaded", "Avatar image has been attached.");
    } catch {
      toast.error("Upload failed", "Unable to upload avatar right now.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Developer Onboarding</h1>
          <p className={styles.subtitle}>
            Complete your profile to personalize your experience.
          </p>
        </div>

        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="githubUsername" className={styles.label}>
                  GitHub Username
                </label>
                <Input
                  id="githubUsername"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Avatar
                </label>
                <div className={styles.uploadActions}>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleAvatarUpload(file);
                      return false;
                    }}
                  >
                    <Button loading={isUploadingAvatar} block>
                      Upload Avatar
                    </Button>
                  </Upload>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar preview" className={styles.avatarPreview} />
                  ) : null}
                </div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="experience" className={styles.label}>
                  Years of Experience
                </label>
                <InputNumber
                  id="experience"
                  min={0}
                  max={80}
                  value={yearsOfExperience}
                  onChange={(value) => setYearsOfExperience(value ?? undefined)}
                  className={`${styles.input} ${styles.fullWidthInputNumber}`}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="studyYear" className={styles.label}>
                  Year of Study (&lt; 10)
                </label>
                <InputNumber
                  id="studyYear"
                  min={0}
                  max={9}
                  value={yearOfStudy}
                  onChange={(value) => setYearOfStudy(value ?? undefined)}
                  className={`${styles.input} ${styles.fullWidthInputNumber}`}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="studyLevel" className={styles.label}>
                Study Level
              </label>
              <Select
                id="studyLevel"
                options={studyLevels.map((item) => ({
                  label: item.label,
                  value: item.value,
                }))}
                value={studyLevel}
                onChange={setStudyLevel}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="bio" className={styles.label}>
                Bio
              </label>
              <Input.TextArea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="location" className={styles.label}>
                Location
              </label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Teamwork Rating ({teamworkRating.toFixed(1)})
              </label>
              <div className={styles.sliderWrap}>
                <Slider
                  min={0}
                  max={10}
                  step={0.1}
                  value={teamworkRating}
                  onChange={setTeamworkRating}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="skills" className={styles.label}>
                Skills
              </label>
              <Select
                id="skills"
                mode="tags"
                value={skills}
                onChange={setSkills}
                className={styles.input}
                placeholder="Add skills"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="goals" className={styles.label}>
                Goals
              </label>
              <Select
                id="goals"
                mode="tags"
                value={goals}
                onChange={setGoals}
                className={styles.input}
                placeholder="Add learning goals"
              />
            </div>

            {isError ? (
              <div className={styles.statusError}>
                Unable to save profile right now.
              </div>
            ) : null}
            {isSuccess ? (
              <div className={styles.statusSuccess}>
                Profile synced successfully.
              </div>
            ) : null}

            <div className={styles.actions}>
              <Button htmlType="button" onClick={() => router.push("/")}>
                Skip for now
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting || isPending}
              >
                Save and Continue
                <ArrowRight size={16} className={styles.buttonIconEnd} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
