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
import { toast } from "sonner";

interface DeleteCampaignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaignTitle: string;
    onConfirm: () => void;
}

const DeleteCampaignDialog = ({ open, onOpenChange, campaignTitle, onConfirm }: DeleteCampaignDialogProps) => {

    const handleDelete = () => {
        onConfirm();
        toast("Campaign deleted", {
            description: "Your campaign has been successfully deleted.",
        });
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="w-full max-w-[min(100vw-2rem,420px)] rounded-3xl border border-border/40 bg-card/95 p-0 shadow-2xl">
                <div className="flex flex-col gap-5 p-5 sm:p-6">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete &ldquo;{campaignTitle}&ldquo;? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="rounded-2xl bg-destructive text-white hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteCampaignDialog;
