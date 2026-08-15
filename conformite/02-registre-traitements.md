# Registre des activités de traitement

Tenue conformément à l'article 435 de la loi n° 2017-20 du 20 avril 2018 portant Code du
numérique en République du Bénin.

**Responsable de traitement :** BOUDZOUMOU Florent Junior, personne physique — Fidjrosse,
C/1776, Maison QUENUM Rogatien, Cotonou, Bénin
**Contexte :** projet Xwégán développé par une équipe de 8 personnes, sans structure juridique
constituée à ce jour ; le responsable du traitement est désigné à titre individuel.
**DPO :** CHOUCHOU Curie — dpo@xwegan.com
**Dernière mise à jour :** ______________________

> Renseignements : voir `renseignements.md`.

---

## Traitement 1 — Gestion des comptes utilisateurs

- **Finalité :** création et gestion des comptes propriétaires et locataires, authentification,
  sécurité du service.
- **Données :** nom complet, adresse e-mail, numéro de téléphone, mot de passe (haché), code du
  bien (locataire), logs de connexion, adresse IP.
- **Personnes concernées :** propriétaires et locataires inscrits.
- **Base légale :** consentement (art. 389), exécution du contrat de service.
- **Destinataires :** équipe interne habilitée, sous-traitant d'hébergement.
- **Durée de conservation :** durée de vie du compte, puis [X] mois après clôture.
- **Mesures de sécurité :** accès authentifié, chiffrement des mots de passe, supervision des
  accès.

## Traitement 2 — Gestion des biens et des baux

- **Finalité :** enregistrement des biens immobiliers (immeubles, résidences, villas, maisons),
  des lots, des locataires et des baux ; suivi des loyers de référence.
- **Données :** nom et type du bien, adresse, quartier, ville ; composition des lots ; nom,
  téléphone et e-mail des locataires ; loyer mensuel ; dates de début et de fin de bail.
- **Personnes concernées :** propriétaires et locataires.
- **Base légale :** exécution du contrat de service.
- **Destinataires :** équipe interne habilitée, sous-traitant d'hébergement.
- **Durée de conservation :** durée de vie du compte, puis [X] mois après clôture.
- **Mesures de sécurité :** RLS (Row Level Security) par propriétaire, accès authentifié.

## Traitement 3 — Suivi des paiements et des loyers

- **Finalité :** enregistrement des paiements de loyer en FCFA, génération des quittances,
  gestion des cautions, des reversements aux propriétaires et des relances.
- **Données :** montant, période, méthode de paiement (mobile money, virement, espèces), statut,
  date de paiement, jour de reversement.
- **Personnes concernées :** propriétaires et locataires.
- **Base légale :** exécution du contrat, obligation comptable et fiscale.
- **Destinataires :** équipe interne habilitée, éventuel prestataire de paiement, expert-
  comptable.
- **Durée de conservation :** dix ans pour les documents comptables.
- **Mesures de sécurité :** traçabilité, journaux d'audit, accès habilités.

## Traitement 4 — Signalements de pannes et de litiges

- **Finalité :** réception, suivi et résolution des signalements de pannes et des litiges
  entre propriétaires et locataires.
- **Données :** description du problème, photos éventuelles, dates, participants.
- **Personnes concernées :** propriétaires et locataires.
- **Base légale :** exécution du contrat de service.
- **Destinataires :** équipe interne habilitée, sous-traitant d'hébergement.
- **Durée de conservation :** durée de vie du compte, puis [X] mois après clôture.
- **Mesures de sécurité :** accès authentifié, photos en stockage sécurisé.

## Traitement 5 — Newsletter et prospection

- **Finalité :** envoi d'informations mensuelles sur le produit, uniquement sur consentement.
- **Données :** adresse e-mail.
- **Personnes concernées :** abonnés.
- **Base légale :** consentement (art. 334 — retirable à tout moment).
- **Destinataires :** équipe interne (envoi) ; un outil d'e-mailing sera choisi avant les premiers
  envois.
- **Durée de conservation :** jusqu'au retrait du consentement.
- **Mesures de sécurité :** lien de désinscription, accès restreint.

## Traitement 6 — Gestion des consentements

- **Finalité :** recueil et preuve des consentements (article 389), respect du droit de retrait
  (article 334).
- **Données :** finalité, version et texte exact de la politique acceptée, horodatage, statut
  (accepté / retiré).
- **Personnes concernées :** propriétaires, locataires, abonnés à la newsletter.
- **Base légale :** conformité à une obligation légale (art. 389).
- **Destinataires :** équipe interne habilitée.
- **Durée de conservation :** durée de vie du compte, puis [X] mois après clôture.
- **Mesures de sécurité :** table `consentement` sous RLS, chaque personne ne voit que le sien.

## Traitement 7 — Données techniques et journaux

- **Finalité :** sécurité du service, prévention des fraudes, statistiques d'utilisation
  anonymisées.
- **Données :** adresse IP, journaux d'accès, données de navigation.
- **Personnes concernées :** visiteurs et utilisateurs.
- **Base légale :** intérêt légitime (art. 389), sécurité du service.
- **Destinataires :** équipe interne, sous-traitant d'hébergement.
- **Durée de conservation :** [X] mois.
- **Mesures de sécurité :** journalisation, accès restreint, anonymisation.