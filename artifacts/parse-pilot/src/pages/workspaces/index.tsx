import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Building2, Plus, Users, CreditCard, Loader2, X,
  ChevronRight, Briefcase, Settings,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  listWorkspaces,
  createWorkspace,
  type Workspace,
  ROLE_LABELS,
  WORKSPACE_TYPE_LABELS,
} from "@/lib/workspaces-api";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  pro: "bg-blue-50 text-blue-700",
  recruiter_solo: "bg-purple-50 text-purple-700",
  recruiter_team: "bg-green-50 text-green-700",
};

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [workspaceType, setWorkspaceType] = useState("recruiter_team");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const load = useCallback(async () => {
    try {
      const ws = await listWorkspaces();
      setWorkspaces(ws);
    } catch {
      toast({ variant: "destructive", title: "Failed to load workspaces" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleNameChange(val: string) {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
    }
  }

  async function handleCreate() {
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    try {
      const ws = await createWorkspace({ name: name.trim(), slug: slug.trim(), workspaceType });
      setWorkspaces(prev => [{ ...ws, role: "owner", memberCount: 1 }, ...prev]);
      setShowCreate(false);
      setName(""); setSlug("");
      toast({ title: "Workspace created" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not create workspace", description: e.message });
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Workspaces
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your recruiter team workspaces</p>
          </div>
          <Button onClick={() => setShowCreate(f => !f)} className="gap-2">
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? "Cancel" : "New Workspace"}
          </Button>
        </div>

        {showCreate && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Create New Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Workspace name *</label>
                  <Input
                    placeholder="Acme Recruiting"
                    value={name}
                    onChange={e => handleNameChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Slug * (used in URL)</label>
                  <Input
                    placeholder="acme-recruiting"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <select
                  value={workspaceType}
                  onChange={e => setWorkspaceType(e.target.value)}
                  className="w-full h-9 text-sm rounded-md border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="recruiter_team">Recruiter Team</option>
                  <option value="institution">Institution</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleCreate}
                disabled={creating || !name.trim() || !slug.trim()}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Workspace
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold">No workspaces yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Create a workspace to collaborate with your recruiting team.</p>
            <Button className="mt-4 gap-2" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Create your first workspace
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map(ws => (
              <Card
                key={ws.id}
                className="hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => setLocation(`/workspaces/${ws.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{ws.name}</p>
                        <p className="text-xs text-muted-foreground">/{ws.slug} · {WORKSPACE_TYPE_LABELS[ws.workspaceType] ?? ws.workspaceType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_COLORS[ws.planCode] ?? "bg-gray-100 text-gray-700"}`}>
                        {ws.planCode.replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {ws.memberCount ?? "—"}
                      </span>
                      {ws.role && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {ROLE_LABELS[ws.role] ?? ws.role}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
