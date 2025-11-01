import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface InstitutionCardProps {
  title: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
  image?: string;
  accentColor?: "primary" | "secondary";
}

export const InstitutionCard = ({
  title,
  description,
  href,
  icon,
  image,
  accentColor = "primary"
}: InstitutionCardProps) => {
  const accentClasses = accentColor === "primary"
    ? "text-primary group-hover:text-primary"
    : "text-secondary group-hover:text-secondary";

  const borderHoverClass = accentColor === "primary"
    ? "group-hover:border-primary/30"
    : "group-hover:border-secondary/30";

  return (
    <Link to={href} className="block group">
      <Card className={`
        p-8 md:p-10 h-full
        card-elevated
        gradient-primary
        border border-border
        ${borderHoverClass}
        transition-all duration-300 ease-in-out
        hover:scale-[1.02]
        hover:shadow-xl
        hover:shadow-primary/5
        group-hover:gradient-primary-hover
      `}>
        <div className="flex flex-col items-center text-center space-y-6">
          {image ? (
            <div className="w-40 h-24 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-all duration-300"
              />
            </div>
          ) : icon ? (
            <div className={`
              p-6 rounded-full bg-muted
              ${accentClasses}
              transition-all duration-300
              group-hover:bg-${accentColor}/10
              group-hover:scale-110
            `}>
              {icon}
            </div>
          ) : null}

          <div className="space-y-4">
            <h2 className={`
              text-2xl md:text-3xl
              font-serif font-bold
              text-foreground
              transition-colors duration-300
              ${accentClasses}
            `}>
              {title}
            </h2>
            <p className="text-muted-foreground body-large max-w-md">
              {description}
            </p>
          </div>

          <div className={`
            flex items-center gap-2
            ${accentClasses}
            font-medium text-sm
            transition-all duration-300
            group-hover:gap-3
            pt-2
          `}>
            <span>Öppna</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </Card>
    </Link>
  );
};