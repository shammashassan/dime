import { LogoMark } from "./logo-mark";

export function Logo() {
    return (
        <div className="flex items-center gap-2">
            <LogoMark className="size-8 text-primary" />

            <span className="text-xl font-bold tracking-tight">
                Dime
            </span>
        </div>
    );
}