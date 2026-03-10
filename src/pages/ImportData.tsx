import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Database } from "lucide-react";

export default function ImportData() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-extrabold text-foreground">Import Data</h2>
        <p className="text-muted-foreground mt-1">Upload member data from external sources</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group cursor-pointer" onClick={() => toast.info("Excel import coming soon!")}>
          <CardContent className="p-8 text-center">
            <div className="bg-success/20 p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="h-8 w-8 text-success" />
            </div>
            <h3 className="font-display font-bold text-foreground mb-2">Excel / CSV</h3>
            <p className="text-sm text-muted-foreground">Import members from spreadsheet files</p>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer" onClick={() => toast.info("Bulk upload coming soon!")}>
          <CardContent className="p-8 text-center">
            <div className="gradient-primary p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-display font-bold text-foreground mb-2">Bulk Upload</h3>
            <p className="text-sm text-muted-foreground">Upload multiple records at once</p>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer" onClick={() => toast.info("Database sync coming soon!")}>
          <CardContent className="p-8 text-center">
            <div className="bg-info/20 p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Database className="h-8 w-8 text-info" />
            </div>
            <h3 className="font-display font-bold text-foreground mb-2">Database Sync</h3>
            <p className="text-sm text-muted-foreground">Connect to external databases</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
