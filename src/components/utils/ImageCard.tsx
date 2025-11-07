"use client";

import { Trash2, SquareArrowOutUpRight } from "lucide-react";

interface DocumentCardProps {
  doc: {
    id: number | string;
    doc_og_name: string;
    signedUrl: string;
    created_at?: string;
  };
  index?: number;
  canDelete?: boolean; // ✅ now controlled from parent
  onView?: (index: number) => void;
  onDelete?: (id: number | string) => void;
}

export const ImageComponent: React.FC<DocumentCardProps> = ({
  doc,
  index = 0,
  canDelete = false,
  onView,
  onDelete,
}) => {

  
  return (
    <div className="relative flex items-center gap-4 p-3 border rounded-xl max-w-[310px]">
      {/* ✅ Delete Button - conditional via prop */}
      {canDelete && (
        <button
          onClick={() => onDelete?.(doc.id)}
          className="absolute top-3 right-1.5 p-1 rounded-full  dark:bg-red-950 border dark:border-red-800 
                      dark:hover:bg-red-900 transition-all z-10"
          title="Delete Document"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      )}

      {/* Thumbnail */}
      <div className="flex-shrink-0">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
          <img
            src={doc.signedUrl}
            alt={doc.doc_og_name}
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate pr-6">
            {doc.doc_og_name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Uploaded on{" "}
            {new Date(doc.created_at!).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => onView?.(index)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium text-xs"
            title="View Document"
          >
            <SquareArrowOutUpRight className="w-4 h-4" />
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );
};
