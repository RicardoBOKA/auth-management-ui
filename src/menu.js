import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import BiotechIcon from '@mui/icons-material/Biotech';
import React from 'react';

export const menu = [
  {
    //Accueil (Home)
    icon: <HomeOutlinedIcon />,
    title: 'menu.home.title',
    description: 'menu.home.description',
    route: '/',
    items: []
  },
  {
    //Gestion des données (Data Management)
    icon: <DatasetOutlinedIcon />,
    title: 'menu.dataManagement.title',
    description: 'menu.dataManagement.description',
    items: [
      {
        title: 'menu.entity.title',
        route: '/Entity',
        items: []
      },
      {
        title: 'menu.alarm.title',
        route: '/Alarms',
        items: []
      }
    ]
  },
  {
    //Sécurité (Security)
    icon: <SecurityOutlinedIcon />,
    title: 'menu.security.title',
    description: 'menu.security.description',
    items: [
      {
        title: 'menu.policy.title',
        route: '/Policy',
        items: []
      }
    ]
  },
  {
    //Administration => {Tenant ; Service ; RessurceType}
    icon: <AdminPanelSettingsOutlinedIcon />,
    title: 'menu.administration.title',
    description: 'menu.administration.description',
    withRole: 'tenant-admin',
    withSuperAdmin: true,
    items: [
      {
        title: 'menu.tenant.title',
        route: '/Tenant',
        withSuperAdmin: true,
        items: []
      },
      {
        title: 'menu.service.title',
        route: '/Service',
        withRole: 'tenant-admin',
        withSuperAdmin: true,
        items: []
      },
      {
        title: 'menu.resourcetype.title',
        route: '/ResourceType',
        withRole: 'tenant-admin',
        withSuperAdmin: true,
        items: []
      }
    ]
  },
  {
    //Sécurité (Security)
    icon: <BiotechIcon />,
    title: 'menu.test.title',
    description: 'menu.test.description',
    items: [
      {
        title: 'menu.test.title',
        route: '/restriction',
        items: []
      }
    ]
  }
];
