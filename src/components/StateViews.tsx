export function LoadingState({ message = "Loading the landscape from Dataverse…" }: { message?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <h2>Dependency Atlas</h2>
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state" role="alert">
      <h2>Couldn't load the atlas</h2>
      <p>{message}</p>
      <p>
        Check that you have access to the <code>espc26_asset</code> and <code>espc26_dependency</code> tables in this environment.
      </p>
      <button className="primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="state">
      <h2>No assets yet</h2>
      <p>
        The Asset table is empty. Seed the demo landscape with <code>npm run seed</code> and reload.
      </p>
      <button className="primary" onClick={onRetry}>
        Reload
      </button>
    </div>
  );
}
