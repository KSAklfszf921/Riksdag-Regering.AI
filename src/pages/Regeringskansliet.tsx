import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Newspaper, Scale, Globe, Folder } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/navigation/AppHeader";
import { DynamicBreadcrumbs } from "@/components/navigation/DynamicBreadcrumbs";

const Regeringskansliet = () => {
  const documentCategories = [
    {
      title: "Rättsliga dokument",
      icon: Scale,
      variant: "warning" as const,
      items: [
        { title: "Propositioner", href: "/regeringskansliet/propositioner", description: "Lagförslag från regeringen" },
        { title: "Departementsserien (Ds)", href: "/regeringskansliet/departementsserien", description: "Utredningar från departementen" },
        { title: "SOU", href: "/regeringskansliet/sou", description: "Statens offentliga utredningar" },
        { title: "Skrivelser", href: "/regeringskansliet/skrivelse", description: "Regeringens skrivelser" },
        { title: "Förordningsmotiv", href: "/regeringskansliet/forordningsmotiv", description: "Motiv till förordningar" },
        { title: "Kommittédirektiv", href: "/regeringskansliet/kommittedirektiv", description: "Direktiv till utredningar" },
        { title: "Lagradsremisser", href: "/regeringskansliet/lagradsremiss", description: "Remisser till Lagrådet" },
        { title: "Remisser", href: "/regeringskansliet/remisser", description: "Remissförfaranden" },
        { title: "Regeringsärenden", href: "/regeringskansliet/regeringsarenden", description: "Ärenden behandlade av regeringen" },
        { title: "Regeringsuppdrag", href: "/regeringskansliet/regeringsuppdrag", description: "Uppdrag till myndigheter" },
        { title: "Sakråd", href: "/regeringskansliet/sakrad", description: "Sakråd och expertråd" },
      ]
    },
    {
      title: "Kommunikation",
      icon: Newspaper,
      variant: "info" as const,
      items: [
        { title: "Pressmeddelanden", href: "/regeringskansliet/pressmeddelanden", description: "Pressmeddelanden från regeringen" },
        { title: "Artiklar", href: "/regeringskansliet/artiklar", description: "Artiklar från regeringskansliet" },
        { title: "Debattartiklar", href: "/regeringskansliet/debattartiklar", description: "Debattartiklar från regeringen" },
        { title: "Tal", href: "/regeringskansliet/tal", description: "Tal av statsministern och ministrarna" },
        { title: "Uttalanden", href: "/regeringskansliet/uttalanden", description: "Uttalanden från regeringen" },
      ]
    },
    {
      title: "Internationellt",
      icon: Globe,
      variant: "success" as const,
      items: [
        { title: "MR-granskningar", href: "/regeringskansliet/mr-granskningar", description: "Mänskliga rättigheter - granskningar" },
        { title: "Biståndsstrategier", href: "/regeringskansliet/bistands-strategier", description: "Strategier för utvecklingssamarbete" },
        { title: "UD avråder", href: "/regeringskansliet/ud-avrader", description: "Utrikesdepartementets reseavråden" },
        { title: "Internationella överenskommelser", href: "/regeringskansliet/internationella-overenskommelser", description: "Internationella fördrag och avtal" },
        { title: "Faktapromemorior", href: "/regeringskansliet/faktapromemoria", description: "Faktapromemorior om EU-ärenden" },
      ]
    },
    {
      title: "Övrigt",
      icon: Folder,
      variant: "error" as const,
      items: [
        { title: "Dokument", href: "/regeringskansliet/dokument", description: "Alla dokument från regeringen.se" },
        { title: "Kategorier", href: "/regeringskansliet/kategorier", description: "Dokumentkategorier" },
        { title: "Dagordningar", href: "/regeringskansliet/dagordningar", description: "Dagordningar för regeringssammanträden" },
        { title: "Rapporter", href: "/regeringskansliet/rapporter", description: "Rapporter från regeringskansliet" },
        { title: "Överenskommelser & avtal", href: "/regeringskansliet/overenskommelser-avtal", description: "Överenskommelser med organisationer" },
        { title: "Ärendeförteckningar", href: "/regeringskansliet/arendeforteckningar", description: "Förteckningar över ärenden" },
        { title: "Informationsmaterial", href: "/regeringskansliet/informationsmaterial", description: "Informationsmaterial" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <DynamicBreadcrumbs />

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Regeringskansliet
          </h1>
          <div className="w-20 h-1 bg-secondary mb-6"></div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Utforska 30+ dokumenttyper från regeringen.se via g0v.se öppna data
          </p>
        </header>

        {/* Tabs Navigation - Reduced information overload */}
        <Tabs defaultValue="legal" className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2">
            {documentCategories.map((category) => (
              <TabsTrigger
                key={category.title}
                value={category.title.toLowerCase().replace(/\s+/g, '-')}
                className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <category.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{category.title}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {category.items.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {documentCategories.map((category) => (
            <TabsContent
              key={category.title}
              value={category.title.toLowerCase().replace(/\s+/g, '-')}
              className="mt-6"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <category.icon className="h-6 w-6 text-primary" />
                  {category.title}
                  <Badge variant="outline">{category.items.length} typer</Badge>
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map((item) => (
                  <Link key={item.href} to={item.href}>
                    <Card className="group h-full card-elevated hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/30 transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Regeringskansliet;