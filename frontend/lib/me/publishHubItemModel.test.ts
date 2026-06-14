import { describe, expect, it } from "vitest";
import {
  mapPublishHubGovernanceItems,
  mapPublishHubListingItems,
  mapPublishHubTripItems,
} from "@/lib/me/publishHubItemMappers";
import { publishHubCommunityPostManageHref } from "@/lib/me/publishHubCommunityLinks";
import {
  publishHubItemStatusToneForGovernanceStatus,
  publishHubItemStatusToneForListingKind,
} from "@/lib/me/publishHubItemModel";

describe("publishHubItemModel", () => {
  it("maps listing kind to badge tone", () => {
    expect(publishHubItemStatusToneForListingKind("published")).toBe("success");
    expect(publishHubItemStatusToneForListingKind("draft")).toBe("warning");
  });

  it("maps governance status to badge tone", () => {
    expect(publishHubItemStatusToneForGovernanceStatus("pending")).toBe("warning");
    expect(publishHubItemStatusToneForGovernanceStatus("executed")).toBe("success");
  });
});

describe("publishHubItemMappers", () => {
  it("maps trip rows with cover and primary action", () => {
    const items = mapPublishHubTripItems(
      [
        {
          id: "o1",
          title: "Paris",
          statusLabel: "draft",
          href: "/escrow/o1",
          coverUrl: "https://example.com/trip.jpg",
        },
      ],
      "Open",
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.rail).toBe("trip");
    expect(items[0]?.coverUrl).toBe("https://example.com/trip.jpg");
    expect(items[0]?.primaryAction?.href).toBe("/escrow/o1");
  });

  it("maps governance rows with status badge tone", () => {
    const items = mapPublishHubGovernanceItems(
      [{ id: "1", title: "Fee change", status: "pending", href: "/governance/proposals/1" }],
      "View",
    );
    expect(items[0]?.statusTone).toBe("warning");
  });

  it("maps listing rows with archive/delete secondary actions", () => {
    const archived = mapPublishHubListingItems({
      rail: "merchant",
      rows: [{ kind: "published", id: "l1", title: "Tour" }],
      publishedLabel: "Published",
      draftLabel: "Draft",
      archiveLabel: "Archive",
      archivingLabel: "Archiving",
      deleteDraftLabel: "Delete",
      deletingLabel: "Deleting",
      mutatingId: null,
      onArchivePublished: () => {},
      onDeleteDraft: () => {},
      variantDataAttr: "merchant",
    });
    expect(archived[0]?.secondaryActions?.[0]?.id).toBe("archive");

    const draft = mapPublishHubListingItems({
      rail: "acquisition",
      rows: [{ kind: "draft", id: "d1", title: "Draft" }],
      publishedLabel: "Published",
      draftLabel: "Draft",
      archiveLabel: "Archive",
      archivingLabel: "Archiving",
      deleteDraftLabel: "Delete",
      deletingLabel: "Deleting",
      mutatingId: null,
      onArchivePublished: () => {},
      onDeleteDraft: () => {},
      variantDataAttr: "acquisition",
    });
    expect(draft[0]?.secondaryActions?.[0]?.id).toBe("delete-draft");
  });

  it("maps listing rows with cover from showcase row", () => {
    const items = mapPublishHubListingItems({
      rail: "merchant",
      rows: [{ kind: "published", id: "l1", title: "Tour", coverUrl: "https://cdn.example/c.jpg" }],
      publishedLabel: "Published",
      draftLabel: "Draft",
      archiveLabel: "Archive",
      archivingLabel: "Archiving",
      deleteDraftLabel: "Delete",
      deletingLabel: "Deleting",
      mutatingId: null,
      onArchivePublished: () => {},
      onDeleteDraft: () => {},
      variantDataAttr: "merchant",
    });
    expect(items[0]?.coverUrl).toBe("https://cdn.example/c.jpg");
  });

  it("community post deep link helper targets my posts page", () => {
    expect(publishHubCommunityPostManageHref("p-abc")).toBe("/community/me/posts?post=p-abc");
    expect(publishHubCommunityPostManageHref("")).toBe("/community/me/posts");
  });
});
