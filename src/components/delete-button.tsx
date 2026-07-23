"use client";

interface DeleteButtonProps {
  deleteUrl: string;
  entityName: string;
  redirectTo: string;
}

export default function DeleteButton({
  deleteUrl,
  entityName,
  redirectTo,
}: DeleteButtonProps) {
  const handleDelete = async () => {
    const confirmed = window.confirm(
      `¿Estás seguro de que querés eliminar ${entityName}? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    try {
      const res = await fetch(deleteUrl, { method: "DELETE" });

      if (res.status === 409) {
        const body = await res.json();
        alert(body.error);
        return;
      }

      if (res.ok) {
        window.location.href = redirectTo;
        return;
      }

      alert("Error al eliminar. Intentá de nuevo.");
    } catch {
      alert("Error al eliminar. Intentá de nuevo.");
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
    >
      <svg
        className="-ml-1 mr-1.5 inline-block h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      Eliminar
    </button>
  );
}
