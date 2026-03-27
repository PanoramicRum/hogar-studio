"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface GuestProject {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  images: { id: string; type: string; url: string; filename: string; metadata?: Record<string, unknown> }[];
  elements: { id: string; name: string; type: string; positionX: number; positionY: number; width: number; height: number; rotation: number; furnitureUrl: string | null; furnitureData: Record<string, string> | null }[];
  designFiles: { id: string; name: string; style: string; status: string; aiParams: Record<string, unknown> | null; renders: { id: string; imageUrl: string; prompt: string; modelUsed: string; createdAt: string }[]; _count: { renders: number } }[];
  _count: { images: number; elements: number; designFiles: number };
  createdAt: string;
  updatedAt: string;
}

interface GuestContextValue {
  isGuest: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  projects: GuestProject[];
  addProject: (name: string, description?: string) => GuestProject;
  getProject: (id: string) => GuestProject | undefined;
  updateProject: (id: string, updates: Partial<GuestProject>) => void;
  deleteProject: (id: string) => void;
}

const GuestContext = createContext<GuestContextValue>({
  isGuest: false,
  enterGuestMode: () => {},
  exitGuestMode: () => {},
  projects: [],
  addProject: () => ({} as GuestProject),
  getProject: () => undefined,
  updateProject: () => {},
  deleteProject: () => {},
});

function makeId() {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newProject(name: string, description?: string): GuestProject {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    name,
    description: description || null,
    coverImageUrl: null,
    images: [],
    elements: [],
    designFiles: [],
    _count: { images: 0, elements: 0, designFiles: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

export function GuestProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const [projects, setProjects] = useState<GuestProject[]>([]);

  const enterGuestMode = useCallback(() => setIsGuest(true), []);
  const exitGuestMode = useCallback(() => {
    setIsGuest(false);
    setProjects([]);
  }, []);

  const addProject = useCallback((name: string, description?: string) => {
    const p = newProject(name, description);
    setProjects((prev) => [p, ...prev]);
    return p;
  }, []);

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects]
  );

  const updateProject = useCallback((id: string, updates: Partial<GuestProject>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updates,
              _count: {
                images: (updates.images ?? p.images).length,
                elements: (updates.elements ?? p.elements).length,
                designFiles: (updates.designFiles ?? p.designFiles).length,
              },
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <GuestContext.Provider
      value={{ isGuest, enterGuestMode, exitGuestMode, projects, addProject, getProject, updateProject, deleteProject }}
    >
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  return useContext(GuestContext);
}
