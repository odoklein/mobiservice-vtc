import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CONTACT, VTC_DEPOT } from '@/lib/constants';
import { ArrowLeft, FileText, Shield, AlertCircle, Euro, Calendar, XCircle, Scale, Clock, CreditCard, ShieldAlert, Lock, Briefcase, Gavel } from 'lucide-react';

export const metadata = {
    title: 'Conditions Générales de Vente | MobiService VTC',
    description: 'Conditions générales de vente et d\'utilisation du service de transport VTC MobiService en Haute-Savoie, France, Suisse et Europe.',
};

export default function CGVPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero */}
            <section className="bg-black text-white py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-black/80"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Retour à l'accueil
                    </Link>
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="h-10 w-10 text-[#00FF88]" />
                        <h1 className="text-3xl md:text-4xl font-bold">
                            Conditions Générales de Vente
                        </h1>
                    </div>
                    <p className="text-white/60">
                        Mobi Service VTC • Transport de personnes avec chauffeur privé
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="py-12 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Préambule */}
                        <Card className="border-[#00FF88]/20 bg-[#00FF88]/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-6 w-6 text-[#00FF88]" />
                                    Préambule
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-gray-700">
                                <p>
                                    Le transport de personnes à titre payant est une activité réglementée, seuls les véhicules autorisés, VTC et taxis, peuvent effectuer ce service. Toute commande effectuée entraîne l'acceptation des conditions générales de vente (CGV) ci-après, Mobi Service VTC s'engage à les respecter dans leur intégralité et à mettre tout en œuvre pour garantir un service irréprochable pour ses clients.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Tarifs */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">1</Badge>
                                    <Euro className="h-5 w-5 text-[#00FF88]" />
                                    Tarifs
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-gray-700">
                                <p>
                                    Tout devis préalablement établi et en votre possession sera valable uniquement s'il ne dépasse pas <strong>5 jours</strong> à compter de sa date d'émission.
                                </p>
                                <p>
                                    Le tarif s'applique au déplacement direct sans arrêt depuis le point de prise en charge et ce jusqu'au point d'arrivée.
                                </p>
                                <p>
                                    Les tarifs s'entendent <strong>TTC (TVA 10%)</strong> sauf pour les mises à disposition et frais d'autoroute (TVA 20%) et sont toujours mentionnés en euros.
                                </p>
                                <p>
                                    Ils incluent l'acheminement du ou des clients, le véhicule, le carburant, le chauffeur, l'assurance des personnes transportées et les prestations offertes à bord (boissons non alcoolisées, bonbons, etc...), sur demande de la clientèle.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Réservation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">2</Badge>
                                    <Calendar className="h-5 w-5 text-[#00FF88]" />
                                    Réservation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-gray-700">
                                <p>
                                    Toute prestation doit faire l'objet d'une réservation en contactant Mobi Service VTC par téléphone, par SMS, par e-mail ou directement sur le site ou l'application.
                                </p>
                                <p>
                                    La réservation doit être effectuée au plus tôt <strong>60 minutes</strong> avant le début de la dite prestation et sera effective que si et seulement si le chauffeur peut honorer celle-ci suivant son emplacement géographique. La réservation doit être effectuée par le client ou par un mandataire dûment autorisé.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="font-semibold mb-3">Toute réservation doit mentionner obligatoirement :</p>
                                    <ul className="list-disc list-inside space-y-2 text-sm">
                                        <li>Nom ou dénomination sociale de la société</li>
                                        <li>Nom et coordonnées téléphoniques du client</li>
                                        <li>Date, heure et lieu de la prise en charge du client</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Annulation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">3</Badge>
                                    <XCircle className="h-5 w-5 text-[#00FF88]" />
                                    Annulation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-gray-700">
                                <p>
                                    Toute annulation devra nous parvenir au plus tard <strong>8 heures</strong> avant la prestation. Il est de votre devoir de prévenir la société Mobi Service VTC en cas de problème le plus rapidement possible.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                        <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <strong>Annulation anticipée</strong><br />
                                            Plus de 8 heures avant la prestation : <strong>Annulation gratuite</strong>, aucun frais.
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <strong>Annulation tardive</strong><br />
                                            Moins de 8 heures avant la prestation : Frais d'annulation de <strong>20 € TTC maximum</strong>.
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Responsabilité */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">4</Badge>
                                    <Scale className="h-5 w-5 text-[#00FF88]" />
                                    Responsabilité
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-gray-700">
                                <p>
                                    Tout dommage causé par le client à l'intérieur ou à l'extérieur du véhicule sera à sa charge (ouverture de portière), à moins qu'il ne soit démontré qu'il provienne du fait d'une tierce personne.
                                </p>
                                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                                    <p className="font-semibold text-red-800 mb-2">Interdictions strictes :</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                                        <li>Il est strictement interdit de fumer dans le véhicule</li>
                                        <li>Le port de la ceinture de sécurité est obligatoire à l'avant comme à l'arrière</li>
                                        <li>Le client ne peut exiger que le chauffeur dépasse la limitation de vitesse ou commette des infractions</li>
                                    </ul>
                                </div>
                                <p>
                                    Mobi Service VTC se réserve le droit d'interrompre la prestation en cours si le client commet une infraction : usage de stupéfiant, prise d'alcool, parole déplacée vis-à-vis du chauffeur ou d'une personne, ou si le client met la sécurité du chauffeur ou d'autrui en danger.
                                </p>
                                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                    <p className="font-semibold text-amber-800">
                                        Pénalités de salissures : <span className="text-amber-900">100€</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Durée et lieu */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">5</Badge>
                                    <Clock className="h-5 w-5 text-[#00FF88]" />
                                    Durée et lieu d'exécution de la prestation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-gray-700">
                                <p>
                                    La prestation tarifaire débute au jour et à l'heure fixé entre le client et la société Mobi Service VTC avec pour point de départ, le lieu de station du véhicule pour rejoindre le lieu de prise en charge de la clientèle jusqu'à sa destination sur son lieu de dépose en prenant en compte le retour au point de dépôt du VTC.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Modification en cours */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">6</Badge>
                                    Modification en cours de service
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-gray-700">
                                <p>
                                    Toute modification par le client en cours de prestation entraînera obligatoirement un supplément, si et seulement si la distance prévue initialement venait à s'allonger.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Règlement */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">7</Badge>
                                    <CreditCard className="h-5 w-5 text-[#00FF88]" />
                                    Règlement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-gray-700">
                                <p>
                                    Nos prestations sont <strong>payables à l'avance à 50% ou en totalité</strong> à la réservation ou à la prise en charge, sauf pour les clients « pro ». Ce client professionnel devra honorer le paiement sous <strong>30 jours</strong> à compter de la date d'émission de la facture.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="font-semibold mb-3">Modes de règlement acceptés :</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>Espèces</li>
                                        <li>Carte Bancaire (ou par lien de paiement)</li>
                                        <li>Virement bancaire</li>
                                    </ul>
                                </div>
                                <p className="text-sm">
                                    Le client se verra remettre obligatoirement une facture pour tout paiement supérieur ou égal à <strong>33€</strong>.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Clauses limitatives */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">8</Badge>
                                    <ShieldAlert className="h-5 w-5 text-[#00FF88]" />
                                    Clauses limitatives de responsabilités
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-gray-700">
                                <p>
                                    Mobi Service VTC ne peut être tenu responsable des retards dus à des circonstances indépendantes de sa volonté (routes barrées, déviations, embouteillages, conditions météorologiques, manifestations, etc...). Dans ces cas, nous mettrons tout en œuvre pour assurer la prise en charge du client par un autre chauffeur.
                                </p>
                                <p>
                                    Les bagages ou tout autre objet appartenant au client sont sous son entière responsabilité.
                                </p>
                                <p>
                                    Mobi Service VTC reconnaît l'obligation de prendre les mesures nécessaires à la préservation de la sécurité des occupants du véhicule et se réserve le droit de refuser toute personne qui compromettrait la sécurité et la bonne conservation du véhicule.
                                </p>
                                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                    <p className="font-semibold text-amber-800 mb-2">Transport d'animaux</p>
                                    <p className="text-sm text-amber-700">
                                        Le transport d'animaux est normalement interdit sauf si Mobi Service VTC en a été informé au préalable et en a validé l'autorisation.
                                    </p>
                                </div>
                                <p className="text-sm">
                                    Mobi Service VTC ne sera tenu comme responsable de la perte ou de l'égarement de tout objet, quel qu'il soit, qui serait resté dans son véhicule une fois la prestation terminée. Tout objet oublié et bien présent dans le véhicule vous sera restitué dans les plus brefs délais à vos frais.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Assurance */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">9</Badge>
                                    <Shield className="h-5 w-5 text-[#00FF88]" />
                                    Assurance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-gray-700">
                                <p>
                                    La responsabilité de Mobi Service VTC est limitée aux clauses de son contrat d'assurance. Son assurance professionnelle « souscrite pour le transport de voyageurs à titre onéreux » couvre de façon <strong>illimitée</strong> les passagers transportés à titre onéreux à bord du véhicule en cas d'accident avec dommage corporel, conformément à la réglementation française en vigueur : Article L3120.4 du code des transports et en application de l'arrêté du 18 avril 1966 relatif aux conditions de l'exercice de la profession de Véhicule de Transport avec Chauffeur (VTC).
                                </p>
                            </CardContent>
                        </Card>

                        {/* Données personnelles */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">10</Badge>
                                    <Lock className="h-5 w-5 text-[#00FF88]" />
                                    Données personnelles
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-gray-700">
                                <p>
                                    Mobi Service VTC s'engage à respecter la vie privée de ses clients. Les informations collectées auprès de ceux-ci ne seront en aucun cas transmises à des tiers.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Sécurité */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">11</Badge>
                                    <Briefcase className="h-5 w-5 text-[#00FF88]" />
                                    Sécurité
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-gray-700">
                                <p>
                                    Le véhicule et le chauffeur seront munis de tous les documents nécessaires pour le bon déroulement de la prestation.
                                </p>
                                <p>
                                    Le nombre de bagages est ouvert dans la limite de la capacité de chargement du véhicule, cependant chaque bagage ne pourra excéder <strong>20 kilos maxi par personne transportée</strong>. Ces derniers ne devront présenter aucun risque de détérioration pour le véhicule.
                                </p>
                                <p className="text-sm font-medium text-amber-700">
                                    Le non-respect de ces conditions entraînera obligatoirement une surfacturation.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Litiges */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">12</Badge>
                                    <Gavel className="h-5 w-5 text-[#00FF88]" />
                                    Litiges
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-gray-700">
                                <p>
                                    Toute réclamation ne sera acceptée que dans un délai de <strong>120 heures</strong> après l'exécution de la prestation. Une fois ce délai dépassé, seul sera compétent le <strong>tribunal de commerce de Chambéry</strong>.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Contact CTA */}
                        <Card className="border-[#00FF88]/20 bg-[#00FF88]/5">
                            <CardContent className="p-8 text-center">
                                <h3 className="text-xl font-bold mb-4">Une question sur nos CGV ?</h3>
                                <p className="text-gray-600 mb-6">
                                    Notre équipe est à votre disposition pour toute information complémentaire
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button asChild className="bg-[#00FF88] hover:bg-[#00CC6A] text-black">
                                        <Link href="/contact">Nous contacter</Link>
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link href="/tarifs">Voir les tarifs</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
