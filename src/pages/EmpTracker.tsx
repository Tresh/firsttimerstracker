import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonitorSmartphone, Upload, Calendar } from "lucide-react";

export default function EmpTracker() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-extrabold text-foreground">EMP Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Track Early Morning Prayer attendance by importing Free Conference CSV files.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Sessions Imported</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <MonitorSmartphone className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Members Matched</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <Upload className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Unmatched Names</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-xl p-12 text-center space-y-3">
            <MonitorSmartphone className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              Upload a Free Conference CSV file to import EMP attendance data.
            </p>
            <p className="text-sm text-muted-foreground">
              Full CSV import functionality coming in the next session.
            </p>
            <Button variant="outline" disabled>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
