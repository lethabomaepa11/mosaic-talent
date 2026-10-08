import { describe, expect, it } from "vitest";
import { fetchProfileSuccess, saveProfileSuccess } from "../actions";

const profile = {
  userId: 7,
  name: "Ava",
  surname: "Stone",
  userName: "ava.stone",
  emailAddress: "ava@company.com",
  avatarUrl: "https://cdn.example.com/avatar.png",
  role: 1,
};

describe("company-profile actions", () => {
  it("creates fetch/save success payloads", () => {
    expect(fetchProfileSuccess(profile)).toMatchObject({
      payload: {
        profile,
        isPending: false,
        isSuccess: true,
        isError: false,
      },
    });

    expect(saveProfileSuccess(profile)).toMatchObject({
      payload: {
        profile,
        isPending: false,
        isSuccess: true,
        isError: false,
      },
    });
  });
});
