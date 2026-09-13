"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { GlassCard, Button, Badge } from "@/components/ui/glass-card";
import { format } from "date-fns";
import InteractiveCalendar from "@/components/ui/visualize-booking";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Star } from "lucide-react";
import { SpaceTabNav, type SpaceTab } from "@/components/space-tab-nav";

type Tab = SpaceTab;

export default function SpaceDetailPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [tab, setTab] = useState<Tab>("tasks");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {tab === "tasks" && <TasksTab spaceId={spaceId} />}
      {tab === "calendar" && <CalendarTab spaceId={spaceId} />}
      {tab === "members" && <MembersTab spaceId={spaceId} />}
      {tab === "announcements" && <AnnouncementsTab spaceId={spaceId} />}
    </div>
  );
}

// ---------------- Tasks ----------------

function TasksTab({ spaceId }: { spaceId: string }) {
  const [tasks, setTasks] = useState<any[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ title: string, deadline: string, points: number | string, assigneeIds: string[] }>({ title: "", deadline: "", points: "", assigneeIds: [] });
  const [members, setMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Submission state
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Review state
  const [reviewingTaskId, setReviewingTaskId] = useState<string | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVE" | "REVISION_REQUESTED" | "REJECT">("APPROVE");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string, role: string } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);

  const load = useCallback(() => {
    fetch(`/api/spaces/${spaceId}/tasks`).then((r) => r.json()).then((d) => {
      setTasks(d.tasks ?? []);
      setCurrentUser({ id: d.currentUserId, role: d.currentUserRole });
      if (d.currentUserRole && ["OWNER", "CORE_ORGANIZER", "TEAM_LEAD"].includes(d.currentUserRole)) {
        fetch(`/api/spaces/${spaceId}/submissions/pending`).then((r) => r.json()).then((pd) => setPendingReviews(pd.pendingSubmissions ?? []));
      }
    });
  }, [spaceId]);

  useEffect(() => {
    load();
    fetch(`/api/spaces/${spaceId}/members`).then((r) => r.json()).then((d) => setMembers(d.active ?? []));
  }, [spaceId, load]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/spaces/${spaceId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, points: Number(form.points) || 0, deadline: new Date(form.deadline).toISOString(), assigneeIds: form.assigneeIds.length ? form.assigneeIds : undefined }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setShowForm(false);
    setForm({ title: "", deadline: "", points: "", assigneeIds: [] });
    load();
  }

  async function reviewTask(submissionId: string) {
    setReviewLoading(true);
    try {
      const decision = reviewDecision === "REVISION_REQUESTED" ? "REQUEST_REVISION" : reviewDecision;
      const res = await fetch(`/api/submissions/${submissionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Review failed");
      }
      setReviewingTaskId(null);
      setReviewComment("");
      setReviewRating(5);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReviewLoading(false);
    }
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/spaces/${spaceId}/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete task");
      load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function submitTask(taskId: string) {
    setSubmitLoading(true);
    try {
      let fileId = undefined;
      if (submitFile) {
        const formData = new FormData();
        formData.append("file", submitFile);
        formData.append("spaceId", spaceId);
        
        const uploadRes = await fetch(`/api/files`, {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
        fileId = uploadData.fileId;
      }

      const res = await fetch(`/api/tasks/${taskId}/submit`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ note: submitNote, fileId }) 
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }
      
      setSubmittingTaskId(null);
      setSubmitFile(null);
      setSubmitNote("");
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "New Task"}</Button>
      </div>

      {showForm && (
        <form onSubmit={createTask} className="glass p-5 space-y-3 relative z-20">
          <input required placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="focus-ring w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <DateTimePicker value={form.deadline} onChange={(val) => setForm({ ...form, deadline: val })} placeholder="Deadline" />
            <input type="number" min={0} value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} placeholder="Points"
              className="focus-ring rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-ink/60 dark:text-white/60 ml-1">Assign to (optional):</span>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 border border-ink/10 dark:border-white/15 rounded-xl bg-white/70 dark:bg-white/5">
              {members.map((m) => {
                const isSelected = form.assigneeIds.includes(m.user.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setForm({ ...form, assigneeIds: form.assigneeIds.filter(id => id !== m.user.id) });
                      } else {
                        setForm({ ...form, assigneeIds: [...form.assigneeIds, m.user.id] });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isSelected 
                        ? "bg-acadly-violet text-white shadow-sm" 
                        : "bg-black/5 dark:bg-white/10 text-ink dark:text-white hover:bg-black/10 dark:hover:bg-white/20"
                    }`}
                  >
                    {m.user.name}
                  </button>
                );
              })}
              {members.length === 0 && <span className="text-xs text-ink/50 dark:text-white/50">No members available</span>}
            </div>
          </div>
          {error && <p className="text-sm text-acadly-coral">{error}</p>}
          <Button type="submit">Create</Button>
        </form>
      )}

      {pendingReviews.length > 0 && (
        <div className="space-y-3 mb-8">
          <h3 className="font-medium text-lg text-acadly-violet">📥 Needs Review</h3>
          {pendingReviews.map((sub) => (
            <GlassCard key={sub.id} className="border border-acadly-violet/20 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{sub.task.title}</p>
                  <p className="text-xs text-ink/50 dark:text-white/50">
                    Submitted by {sub.user.name} · {format(new Date(sub.submittedAt), "d MMM, h:mm a")}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setReviewingTaskId(reviewingTaskId === sub.taskId ? null : sub.taskId)}>
                  {reviewingTaskId === sub.taskId ? "Cancel" : "Review"}
                </Button>
              </div>

              {reviewingTaskId === sub.taskId && (
                <div className="p-4 bg-white/40 dark:bg-black/20 rounded-xl space-y-3 border border-ink/5 dark:border-white/5">
                  <p className="text-sm font-medium">Review Submission</p>
                  {sub.file && (
                    <p className="text-sm text-acadly-violet">
                      <a href={`/api/files/${sub.file.id}`} target="_blank" rel="noreferrer">
                        View attached file: {sub.file.filename}
                      </a>
                    </p>
                  )}
                  {sub.note && (
                    <p className="text-sm text-ink/70 dark:text-white/70 italic">&quot;{sub.note}&quot;</p>
                  )}
                  
                  <div className="flex gap-4 items-center mt-4">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-ink/60 dark:text-white/60 mb-1 block">Decision</label>
                      <select 
                        value={reviewDecision} 
                        onChange={(e: any) => setReviewDecision(e.target.value)}
                        className="focus-ring w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm"
                      >
                        <option value="APPROVE" className="bg-white text-black dark:bg-neutral-900 dark:text-white">Approve</option>
                        <option value="REVISION_REQUESTED" className="bg-white text-black dark:bg-neutral-900 dark:text-white">Request Revision</option>
                        <option value="REJECT" className="bg-white text-black dark:bg-neutral-900 dark:text-white">Reject</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-ink/60 dark:text-white/60 mb-1 block">Rating</label>
                      <div className="flex gap-1 items-center h-[38px]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              size={22}
                              className={star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-ink/20 dark:text-white/20"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <textarea 
                    placeholder="Leave a comment..." 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="focus-ring w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm min-h-[80px]"
                  />

                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setReviewingTaskId(null)} disabled={reviewLoading}>Cancel</Button>
                    <Button onClick={() => reviewTask(sub.id)} disabled={reviewLoading}>
                      {reviewLoading ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {tasks?.map((t) => (
          <GlassCard key={t.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-ink/50 dark:text-white/50">
                  {t.assignees?.length > 0 ? t.assignees.map((a: any) => a.name).join(", ") : "Unassigned"} · Due {format(new Date(t.deadline), "d MMM, h:mm a")} · {t.points} pts
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(t.createdById === currentUser?.id || currentUser?.role === "OWNER" || currentUser?.role === "CORE_ORGANIZER") && (
                  <button onClick={() => deleteTask(t.id)} className="text-acadly-coral/60 hover:text-acadly-coral text-xs font-medium mr-2 transition-colors">
                    Delete
                  </button>
                )}
                <Badge tone={t.status === "COMPLETED" ? "mint" : t.status === "MISSED" ? "coral" : "amber"}>
                  {t.status.replace("_", " ").toLowerCase()}
                </Badge>
                {["ASSIGNED", "IN_PROGRESS", "REVISION_REQUIRED"].includes(t.status) && submittingTaskId !== t.id && t.assignees?.some((a: any) => a.id === currentUser?.id) && (
                  <Button variant="ghost" onClick={() => setSubmittingTaskId(t.id)}>Submit work</Button>
                )}
              </div>
            </div>
            
            {submittingTaskId === t.id && (
              <div className="mt-2 pt-4 border-t border-black/5 dark:border-white/5 flex flex-col gap-3">
                <textarea 
                  placeholder="Add a note (optional)..." 
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                  className="w-full bg-transparent border-0 px-0 py-1 text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:ring-0 resize-none min-h-[40px] outline-none"
                />
                
                <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3">
                  <input 
                    type="file" 
                    onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                    className="text-xs text-black/50 dark:text-white/50 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-black/5 dark:file:bg-white/10 file:text-black dark:file:text-white hover:file:bg-black/10 dark:hover:file:bg-white/20 cursor-pointer"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => { setSubmittingTaskId(null); setSubmitFile(null); setSubmitNote(""); }} 
                      disabled={submitLoading} 
                      className="text-xs font-medium text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors px-3 py-1.5"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => submitTask(t.id)} 
                      disabled={submitLoading} 
                      className="text-xs font-medium bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full hover:scale-105 active:scale-95 transition-all"
                    >
                      {submitLoading ? "..." : "Submit"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        ))}
        {tasks?.length === 0 && <p className="text-sm text-ink/50 dark:text-white/50 text-center py-6">No tasks yet.</p>}
      </div>
    </div>
  );
}

// ---------------- Calendar ----------------

function CalendarTab({ spaceId }: { spaceId: string }) {
  const [events, setEvents] = useState<any[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", startTime: "", endTime: "", location: "" });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/spaces/${spaceId}/events`).then((r) => r.json()).then((d) => setEvents(d.events ?? []));
  }, [spaceId]);

  useEffect(() => { load(); }, [load]);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/spaces/${spaceId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString() }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setShowForm(false);
    setForm({ title: "", startTime: "", endTime: "", location: "" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "New Event"}</Button>
      </div>

      {showForm && (
        <form onSubmit={createEvent} className="glass p-5 space-y-3 relative z-20">
          <input required placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="focus-ring w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <DateTimePicker value={form.startTime} onChange={(val) => setForm({ ...form, startTime: val })} placeholder="Start time" />
            <DateTimePicker value={form.endTime} onChange={(val) => setForm({ ...form, endTime: val })} placeholder="End time" />
          </div>
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="focus-ring w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm" />
          {error && <p className="text-sm text-acadly-coral">{error}</p>}
          <Button type="submit">Create</Button>
        </form>
      )}

      <div className="space-y-3">
        <InteractiveCalendar events={events || []} spaceId={spaceId} onDelete={load} />
      </div>
    </div>
  );
}

// ---------------- Members ----------------

function MembersTab({ spaceId }: { spaceId: string }) {
  const [active, setActive] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState<any>(null);

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/spaces/${spaceId}/members`).then((r) => r.json()).then((d) => {
      setActive(d.active ?? []);
      setPending(d.pending ?? []);
      setCurrentUserRole(d.currentUserRole ?? null);
    });
    fetch(`/api/spaces/${spaceId}/invite-code`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setInviteCode(d.inviteCode));
  }, [spaceId]);

  useEffect(() => { load(); }, [load]);

  async function act(membershipId: string, action: "APPROVE" | "REJECT") {
    await fetch(`/api/spaces/${spaceId}/members/${membershipId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    load();
  }

  async function regenerateCode() {
    const res = await fetch(`/api/spaces/${spaceId}/invite-code`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (res.ok) load();
  }

  async function updateRole(membershipId: string, role: string) {
    await fetch(`/api/spaces/${spaceId}/members/${membershipId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "SET_ROLE", role }),
    });
    load();
  }

  async function removeMember(membershipId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    await fetch(`/api/spaces/${spaceId}/members/${membershipId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "REMOVE" }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <GlassCard className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink/60 dark:text-white/60">Invite code</p>
          <p className="font-display text-xl tracking-widest">{inviteCode?.code ?? "—"}</p>
        </div>
        <Button variant="ghost" onClick={regenerateCode}>Regenerate</Button>
      </GlassCard>

      {pending.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Pending requests</p>
          <div className="space-y-2">
            {pending.map((m) => (
              <GlassCard key={m.id} className="flex items-center justify-between">
                <p className="font-medium text-sm">{m.user.name}</p>
                <div className="flex gap-2">
                  <Button onClick={() => act(m.id, "APPROVE")}>Approve</Button>
                  <Button variant="danger" onClick={() => act(m.id, "REJECT")}>Reject</Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-2">Members</p>
        <div className="space-y-2">
          {active.map((m) => (
            <GlassCard key={m.id} className="flex items-center justify-between overflow-visible">
              <p className="font-medium text-sm">{m.user.name}</p>
              
              <div className="flex items-center gap-3">
                {currentUserRole === "OWNER" && m.role !== "OWNER" ? (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => updateRole(m.id, e.target.value)}
                      className="focus-ring rounded-lg border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-2 py-1 text-sm font-medium"
                    >
                      <option value="VIEWER" className="dark:bg-neutral-900">Viewer</option>
                      <option value="MEMBER" className="dark:bg-neutral-900">Member</option>
                      <option value="TEAM_LEAD" className="dark:bg-neutral-900">Team Lead</option>
                      <option value="CORE_ORGANIZER" className="dark:bg-neutral-900">Core Organizer</option>
                    </select>
                    <button onClick={() => removeMember(m.id)} className="text-xs text-acadly-coral hover:underline font-medium">Remove</button>
                  </>
                ) : (
                  <Badge>{m.role.replace("_", " ").toLowerCase()}</Badge>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Announcements ----------------

function AnnouncementsTab({ spaceId }: { spaceId: string }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string, role: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/spaces/${spaceId}/announcements`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAnnouncements(data);
      });
    fetch(`/api/spaces/${spaceId}/tasks`)
      .then((res) => res.json())
      .then((data) => setCurrentUser({ id: data.currentUserId, role: data.currentUserRole }));
  }, [spaceId]);

  const canPost = currentUser?.role === "OWNER" || currentUser?.role === "CORE_ORGANIZER";

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/spaces/${spaceId}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    if (res.ok) {
      const data = await res.json();
      setAnnouncements([{ ...data, author: { name: "You" } }, ...announcements]); // Optimistic
      setShowForm(false);
      setTitle("");
      setBody("");
    } else {
      const err = await res.json();
      setError(err.error || "Failed to post");
    }
  };

  return (
    <div className="space-y-4">
      {canPost && (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "New Announcement"}</Button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handlePost} className="glass p-5 space-y-3 relative z-20">
          <input required placeholder="Announcement Title" value={title} onChange={(e) => setTitle(e.target.value)}
            className="focus-ring w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm font-medium" />
          <textarea required placeholder="Write your message..." value={body} onChange={(e) => setBody(e.target.value)}
            className="focus-ring w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm min-h-[100px]" />
          {error && <p className="text-sm text-acadly-coral">{error}</p>}
          <Button type="submit">Post Announcement</Button>
        </form>
      )}

      <div className="space-y-4">
        {(!Array.isArray(announcements) || announcements.length === 0) && !showForm && (
          <p className="text-center text-ink/50 dark:text-white/50 py-8">No announcements yet.</p>
        )}
        {Array.isArray(announcements) && announcements.map((a) => (
          <GlassCard key={a.id} className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg">{a.title}</h3>
              <span className="text-xs text-ink/50 dark:text-white/50">{format(new Date(a.createdAt), "MMM d, h:mm a")}</span>
            </div>
            <p className="text-sm text-ink/80 dark:text-white/80 whitespace-pre-wrap">{a.body}</p>
            <div className="pt-2 flex items-center gap-2 text-xs text-ink/50 dark:text-white/50">
              {a.author?.name && <span>Posted by {a.author.name}</span>}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
