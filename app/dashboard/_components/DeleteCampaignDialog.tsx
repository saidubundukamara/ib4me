import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteCampaignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaignTitle: string;
    onConfirm: () => void | Promise<void>;
}

const DeleteCampaignDialog = ({ open, onOpenChange, campaignTitle, onConfirm }: DeleteCampaignDialogProps) => {
    const [deleting, setDeleting] = React.useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await onConfirm();
            toast("Campaign deleted", {
                description: "Your campaign has been successfully deleted.",
            });
            onOpenChange(false);
        } catch {
            // Error toast is handled by the caller
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={(v) => { if (!deleting) onOpenChange(v); }}>
            <AlertDialogContent className="w-full max-w-[min(100vw-2rem,420px)] rounded-3xl border border-border/40 bg-card/95 p-0 shadow-2xl">
                <div className="flex flex-col gap-5 p-5 sm:p-6">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete &ldquo;{campaignTitle}&rdquo;? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-2xl" disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="rounded-2xl bg-destructive text-white hover:bg-destructive/90" disabled={deleting}>
                        {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteCampaignDialog;
