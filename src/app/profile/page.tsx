"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { mockUserProfile, mockAgents } from "@/data/mock";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Agent, UserProfile } from "@/types";
import { Mail, CalendarDays, Edit3, Bot, PlusCircle, Sparkles, ExternalLink, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [createdAgents, setCreatedAgents] = useState<Agent[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfileAndAgents() {
      if (user) {
        const fallbackProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "AgentVerse Member",
          email: user.email || "",
          avatarUrl: user.photoURL || "https://placehold.co/100x100.png",
          bio: "AI enthusiast and AgentVerse marketplace member.",
          createdAt: new Date().toISOString(),
        };

        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            const loaded: UserProfile = {
              id: user.uid,
              name: data.name || fallbackProfile.name,
              email: data.email || fallbackProfile.email,
              avatarUrl: data.avatarUrl || fallbackProfile.avatarUrl,
              bio: data.bio || fallbackProfile.bio,
              createdAt: data.createdAt || fallbackProfile.createdAt,
            };
            setProfile(loaded);
            setEditName(loaded.name);
            setEditBio(loaded.bio || "");
          } else {
            setProfile(fallbackProfile);
            setEditName(fallbackProfile.name);
            setEditBio(fallbackProfile.bio || "");
          }
        } catch {
          setProfile(fallbackProfile);
          setEditName(fallbackProfile.name);
          setEditBio(fallbackProfile.bio || "");
        }
      } else {
        setProfile(mockUserProfile);
        setEditName(mockUserProfile.name);
        setEditBio(mockUserProfile.bio || "");
      }

      try {
        const agentsSnap = await getDocs(collection(db, "agents"));
        const allAgents = agentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Agent[];
        if (user) {
          const mine = allAgents.filter((a) => a.developerId === user.uid);
          setCreatedAgents(mine);
        } else {
          setCreatedAgents(mockAgents.slice(0, 2));
        }
      } catch {
        setCreatedAgents(mockAgents.slice(0, 2));
      }
    }

    if (!authLoading) {
      loadProfileAndAgents();
    }
  }, [user, authLoading]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsSaving(true);

    const updated: UserProfile = {
      ...profile,
      name: editName.trim(),
      bio: editBio.trim(),
    };

    try {
      if (user) {
        await setDoc(
          doc(db, "users", user.uid),
          {
            name: updated.name,
            bio: updated.bio,
            email: updated.email,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      setProfile(updated);
      setEditOpen(false);
      toast({
        title: "Profile Updated",
        description: "Your profile details have been saved.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfile(updated);
      setEditOpen(false);
      toast({
        title: "Profile Updated Locally",
        description: "Changes applied to your current session.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageTitle title="My Profile" description="Manage your AgentVerse account, preferences, and published agents." />

      {!user && !authLoading && (
        <div className="mb-6 p-4 rounded-lg border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Demo Profile View:</strong> Showing sample profile data for{" "}
            <span className="text-foreground font-medium">{mockUserProfile.name}</span>. Sign in to customize and persist your own account.
          </div>
          <Button asChild size="sm">
            <Link href="/auth/login">Sign In / Register</Link>
          </Button>
        </div>
      )}

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 border-b">
          {profile.avatarUrl && (
            <Image
              src={profile.avatarUrl}
              alt={`${profile.name}'s avatar`}
              width={96}
              height={96}
              className="rounded-full border-4 border-primary/20"
              data-ai-hint={profile.dataAiHint || "person portrait"}
            />
          )}
          <div className="flex-1 space-y-1.5">
            <CardTitle className="text-3xl">{profile.name}</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {profile.bio || "No bio provided."}
            </CardDescription>
            <div className="pt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-primary" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Update your public display name and bio shown on AgentVerse.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Display Name</Label>
                  <Input
                    id="profile-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-bio">Bio / Headline</Label>
                  <Textarea
                    id="profile-bio"
                    rows={4}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tell clients and developers about your background..."
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">Saved & Recommended Agents</h3>
                <p className="text-sm text-muted-foreground">
                  Explore or match with autonomous agents tailored to your workflow.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/recommendations">
                  <Sparkles className="mr-2 h-4 w-4 text-primary" /> AI Matchmaker
                </Link>
              </Button>
            </div>
            <div className="p-6 border rounded-lg bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-medium">Looking to hire an AI agent for your team?</p>
                <p className="text-sm text-muted-foreground">
                  Browse verified agents or post a custom job request to receive proposals.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/#agent-listing-section">Browse Catalog</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/jobs/post">Post a Job</Link>
                </Button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">My Listed Agents</h3>
                <p className="text-sm text-muted-foreground">
                  AI agents you have published to the AgentVerse marketplace.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/agents/apply">
                  <PlusCircle className="mr-2 h-4 w-4" /> List New Agent
                </Link>
              </Button>
            </div>

            {createdAgents.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {createdAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-4 border rounded-lg bg-card flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        {agent.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {agent.shortDescription || agent.description}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/agents/${agent.id}`}>
                        View <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-3">
                <p className="text-muted-foreground">You haven&apos;t listed any agents yet.</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/agents/apply">Publish Your First Agent</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
