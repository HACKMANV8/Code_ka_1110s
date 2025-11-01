import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { OverviewTab } from './tabs/OverviewTab';
import { StudentFlowTab } from './tabs/StudentFlowTab';
import { AdminFlowTab } from './tabs/AdminFlowTab';
import { MLPipelineTab } from './tabs/MLPipelineTab';
import { DataStorageTab } from './tabs/DataStorageTab';
import { WebRTCTab } from './tabs/WebRTCTab';
import { DesktopAppTab } from './tabs/DesktopAppTab';
import { RAGSystemTab } from './tabs/RAGSystemTab';
import { 
  LayoutGrid, 
  Users, 
  Shield, 
  Brain, 
  Database, 
  Video,
  Monitor,
  Sparkles
} from 'lucide-react';

export function WorkflowTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full grid grid-cols-4 lg:grid-cols-8 h-auto gap-1">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="student" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Student Flow
        </TabsTrigger>
        <TabsTrigger value="admin" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Admin Flow
        </TabsTrigger>
        <TabsTrigger value="ml" className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          ML Pipeline
        </TabsTrigger>
        <TabsTrigger value="desktop" className="flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          Desktop App
        </TabsTrigger>
        <TabsTrigger value="rag" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          RAG System
        </TabsTrigger>
        <TabsTrigger value="data" className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          Data & Storage
        </TabsTrigger>
        <TabsTrigger value="webrtc" className="flex items-center gap-2">
          <Video className="w-4 h-4" />
          WebRTC
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab />
      </TabsContent>

      <TabsContent value="student">
        <StudentFlowTab />
      </TabsContent>

      <TabsContent value="admin">
        <AdminFlowTab />
      </TabsContent>

      <TabsContent value="ml">
        <MLPipelineTab />
      </TabsContent>

      <TabsContent value="desktop">
        <DesktopAppTab />
      </TabsContent>

      <TabsContent value="rag">
        <RAGSystemTab />
      </TabsContent>

      <TabsContent value="data">
        <DataStorageTab />
      </TabsContent>

      <TabsContent value="webrtc">
        <WebRTCTab />
      </TabsContent>
    </Tabs>
  );
}
