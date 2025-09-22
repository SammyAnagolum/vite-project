import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";
import { NAV, type NavNode } from "@/navigation/nav";
import BrandLogo from "../common/BrandLogo";

export default function Sidebar() {
  return (
    <aside className="hidden w-[260px] shrink-0 border-r bg-sidebar/50 lg:block">
      {/* <div className="flex h-14 items-center border-b px-4">

      </div> */}
      <NavLink to="/">
        <div className="sticky top-0 z-10 border-b bg-sidebar/70 px-4 py-3 h-14 flex items-center justify-between backdrop-blur">
          <BrandLogo variant="horizontal" className="h-28 w-auto" />
          <span className="block text-sm font-semibold">Ops Console</span>
        </div>
      </NavLink>

      <div className="h-[calc(100dvh-52px)] overflow-y-auto px-2 py-3">
        <nav className="space-y-1">
          {NAV.map((n) => <NavBranch key={n.id} node={n} depth={0} />)}
        </nav>
      </div>
    </aside>
  );
}

function NavBranch({ node, depth }: { node: NavNode; depth: number }) {
  const location = useLocation();
  const isLeaf = !!node.path;

  // Determine active state for leaves and groups
  const isActiveLeaf = node.path ? location.pathname.startsWith(node.path) : false;
  const isAncestorActive =
    node.children?.some((c) =>
      location.pathname.startsWith(c.path ?? "") ||
      c.children?.some((g) => location.pathname.startsWith(g.path ?? ""))
    ) ?? false;

  const [open, setOpen] = React.useState(isAncestorActive);

  // Leaf link
  if (isLeaf) {
    return (
      <NavLink
        to={node.path!}
        className={({ isActive }) =>
          cn(
            "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent/60",
            isActive ? "bg-accent text-foreground ring-1 ring-border" : "text-muted-foreground"
          )
        }
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        {node.icon && <node.icon className="h-4 w-4 opacity-70" />}
        <span className="truncate">{node.title}</span>
      </NavLink>
    );
  }

  // Group (collapsible)
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent/60",
          (isAncestorActive || isActiveLeaf) ? "text-foreground" : "text-muted-foreground"
        )}
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        {node.icon && <node.icon className="h-4 w-4 opacity-70" />}
        <span className="flex-1 truncate">{node.title}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "rotate-0")} />
      </button>

      <Collapsible.Content className="space-y-1">
        {node.children?.map((c) => (
          <NavBranch key={c.id} node={c} depth={depth + 1} />
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
