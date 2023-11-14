import React, { Component } from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TenantSelection from './components/shared/tenantSelection';
import axios from 'axios';
import { ApolloClient, InMemoryCache, from, gql, createHttpLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { SnackbarProvider } from 'notistack';
import TenantPage from './pages/tenantPage';
import ServicePage from './pages/servicePage';
import PolicyPage from './pages/policyPage';
import ResourcePage from './pages/resourcePage';
import EntityPage from './pages/entityPage';
import HomePage from './pages/homePage';
import ErrorPage from './pages/errorPage';
import AlarmsPage from './pages/alarmsPage';

import RestrictionPage from './pages/restrictionPage'; //Test

import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import UserMenu from './components/shared/userMenu';
import Alert from '@mui/material/Alert';
import { getEnv } from './env';
import Container from '@mui/material/Container';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { Grid } from '@mui/material';
import { Trans } from 'react-i18next';
import { AuthorizedElement } from './loginComponents/checkRoles';
import Collapse from '@mui/material/Collapse';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

import { menu } from './menu';
import { hasChildren } from './utils';
const env = getEnv();

const drawerWidth = 240;

const HtmlTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(
  ({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
      color: 'rgba(0, 0, 0, 0.87)',
      '&::before': {
        backgroundColor: '#f5f5f9',
        border: '1px solid #dadde9'
      }
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: '#f5f5f9',
      color: 'rgba(0, 0, 0, 0.87)',
      maxWidth: 220,
      fontSize: theme.typography.pxToRem(12),
      border: '1px solid #dadde9'
    }
  })
);

const MenuItem = ({ item, tokenData, onClick, tenantValues, thisTenant }) => {
  const Component = hasChildren(item) ? MultiLevel : SingleLevel;
  return (
    <Component
      item={item}
      tokenData={tokenData}
      onClick={onClick}
      tenantValues={tenantValues}
      thisTenant={thisTenant}
    />
  );
};

const SingleLevel = ({ item, tokenData, onClick, tenantValues, thisTenant }) => {
  const { t } = useTranslation();
  return (
    <AuthorizedElement
      tokenDecoded={tokenData}
      tenantValues={tenantValues}
      thisTenant={thisTenant}
      roleNeeded={item.withRole}
      iSuperAdmin={item.withSuperAdmin}
    >
      <NavLink to={item.route} onClick={onClick}>
        <HtmlTooltip title={t(item.description)} placement="right" arrow>
          <ListItem button>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={t(item.title)} />
          </ListItem>
        </HtmlTooltip>
      </NavLink>
    </AuthorizedElement>
  );
};

const MultiLevel = ({ item, tokenData, onClick, tenantValues, thisTenant }) => {
  const { t } = useTranslation();
  const { items: children } = item;
  const [open, setOpen] = React.useState(false);

  const handleClick = () => {
    setOpen((prev) => !prev);
  };

  return (
    <AuthorizedElement
      tokenDecoded={tokenData}
      tenantValues={tenantValues}
      thisTenant={thisTenant}
      roleNeeded={item.withRole}
      iSuperAdmin={item.withSuperAdmin}
    >
      <React.Fragment>
        <HtmlTooltip title={t(item.description)} placement="right" arrow>
          <ListItem button onClick={handleClick}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={t(item.title)} />
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItem>
        </HtmlTooltip>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {children.map((child, key) => (
              <MenuItem key={key} item={child} tokenData={tokenData} onClick={onClick} />
            ))}
          </List>
        </Collapse>
      </React.Fragment>
    </AuthorizedElement>
  );
};

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  flexGrow: 1,
  marginTop: theme.spacing(12),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginLeft: 0
  })
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open'
})(({ theme, open }) => ({
  minHeight: '60px',
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  ...(open && {
    minHeight: '60px',
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    })
  })
}));

const CustomToolbar = styled(Toolbar)({
  height: '60px',
  borderRadius: 4
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end'
}));

export default class App extends Component {
  state = {
    openLateralMenu: false,
    setOpenLateralMenu: (newValue) => {
      this.setState({ openLateralMenu: newValue, direction: newValue ? 'ltr' : '' });
    },
    direction: 'ltr',
    tokenData: [],
    groups: [],
    language: '',
    homeTitle: '',
    setHomeTitle: (newTitle) => {
      this.setState({ homeTitle: newTitle });
    },
    setAppLanguage: (newLanguagePreference) => {
      this.setState({ language: newLanguagePreference });
      if (this.state.connectionIssue !== false) {
        this.state.getTenants();
      }
    },
    catchColor: (newID) => {
      const data = this.state.tenants.filter((e) => e.id === newID);
      if (data.length > 0) {
        this.setState(
          {
            tenantColor: createTheme({
              palette: {
                primary: {
                  // light: will be calculated from palette.primary.main,
                  main: data[0].props.primaryColor
                  // dark: will be calculated from palette.primary.main,
                },
                secondary: {
                  // light: will be calculated from palette.primary.main,
                  main: data[0].props.secondaryColor
                  // dark: will be calculated from palette.primary.main,
                }
              }
            })
          },
          () => {}
        );
      }
    },
    tenantColor: createTheme({
      palette: {
        primary: {
          main: '#8086ba'
        },
        secondary: {
          main: '#4c61a9'
        },
        contrastThreshold: 3,
        tonalOffset: 0.2
      }
    }),
    tenants: [],
    thisTenant: null,
    seTenant: (newValue) => {
      let tenantFiltered = [];
      tenantFiltered = this.state.tenants.filter((e) => e.id === newValue);

      const httpLink = createHttpLink({
        uri: env.CONFIGURATION_API_URL
      });
      const authLink = setContext((_, { headers }) => {
        return {
          headers: {
            ...headers,
            Authorization: `Bearer ${this.props.accessToken}`
          }
        };
      });
      const client = new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache({ addTypename: false })
      });
      if (newValue !== null) {
        client
          .query({
            query: gql`
              query getUserPreferences($userName: String!) {
                getUserPreferences(userName: $userName) {
                  userName
                  language
                  lastTenantSelected
                  welcomeText {
                    language
                    text
                  }
                }
              }
            `,
            variables: {
              userName: this.props.idTokenPayload.sub,
              state: this.state
            }
          })
          .then((result) => {
            client.mutate({
              mutation: gql`
                mutation modifyUserPreferences(
                  $userName: String!
                  $language: String!
                  $lastTenantSelected: String
                  $welcomeText: [WelcomeText]
                ) {
                  modifyUserPreferences(
                    userName: $userName
                    language: $language
                    lastTenantSelected: $lastTenantSelected
                    welcomeText: $welcomeText
                  ) {
                    userName
                    language
                    lastTenantSelected
                    welcomeText {
                      language
                      text
                    }
                  }
                }
              `,
              variables: {
                userName: this.props.idTokenPayload.sub,
                language: this.state.language,
                lastTenantSelected: newValue,
                welcomeText: result.data.getUserPreferences[0].welcomeText
              }
            });
          });
      }
      this.setState({
        thisTenant:
          tenantFiltered.length === 0 && this.state.tenants.length > 0
            ? (newValue = this.state.tenants[0].id)
            : newValue
      });
      this.state.catchColor(newValue);
    },
    preferencesMapper: (data, userTenants) => {
      if (data.length > 0) {
        data.map((thisData, i) => {
          const index = userTenants
            .map(function (e) {
              return e.name;
            })
            .indexOf(thisData.name);
          userTenants[index].props = thisData;
          return i;
        });
        return userTenants;
      } else {
        userTenants.map(
          (tenant) =>
            (tenant.props = {
              name: tenant.name,
              icon: 'none',
              primaryColor: '#8086ba',
              secondaryColor: '#8086ba'
            })
        );
        this.setState({
          tenants: userTenants
        });
        return userTenants;
      }
    },
    connectionIssue: false,
    recall: null,
    getNetworkError: (thisError, type) => {
      const style = {
        position: 'fixed',
        bottom: '0px',
        width: '100%',
        padding: '3px 3px',
        fontSize: '0.63rem',
        zIndex: 1201
      };
      if (thisError !== '') {
        type === 'error' ? this.setState({ recall: setInterval(() => this.state.getTenants(), 10000) }) : '';
        this.setState({
          connectionIssue: (
            <Alert variant="filled" severity={type} sx={style} icon={false}>
              {thisError}
            </Alert>
          )
        });
      } else {
        this.setState({
          connectionIssue: (
            <Alert variant="filled" severity="info" sx={style} icon={false}>
              Online
            </Alert>
          )
        });
        setTimeout(function () {
          location.reload();
        }, 2300);
      }
    },
    getTenants: () => {
      const anubisURL = typeof env !== 'undefined' ? env.ANUBIS_API_URL : '';
      axios
        .get(anubisURL + 'v1/tenants')
        .then((response) => {
          const userTenants = [];
          let tenantFiltered = [];
          const tenantFilteredNames = [];
          Object.keys(this.state.tokenData.tenants).map((thisTenant, index) => {
            tenantFiltered = response.data.filter((e) => e.name === thisTenant);
            tenantFiltered.length > 0 ? userTenants.push(tenantFiltered[0]) : (tenantFiltered = []);
            return index;
          });
          userTenants.map((thisTenant, index) => {
            tenantFilteredNames.push(thisTenant.name.toString());
            return index;
          });
          const httpLink = createHttpLink({
            uri: env.CONFIGURATION_API_URL
          });

          const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
            if (graphQLErrors)
              graphQLErrors.forEach(({ message }) => operation.variables.state.getNetworkError(message));
            if (networkError) {
              operation.variables.state.getNetworkError(<Trans>common.messages.graphqlOff</Trans>, 'warning');
              operation.variables.state.preferencesMapper([], userTenants);
              operation.variables.state.seTenant(operation.variables.state.thisTenant);
            }
          });

          const authLink = setContext((_, { headers }) => {
            // get the authentication token from local storage if it exists
            // return the headers to the context so httpLink can read them
            return {
              headers: {
                ...headers,
                authorization: `Bearer ${this.props.accessToken}`
              }
            };
          });

          const client = new ApolloClient({
            link: from([errorLink, authLink.concat(httpLink)]),
            cache: new InMemoryCache({ addTypename: false })
          });

          client
            .query({
              query: gql`
                query listTenants($tenantNames: [String]!) {
                  listTenants(tenantNames: $tenantNames) {
                    name
                    icon
                    primaryColor
                    secondaryColor
                    customImage
                  }
                }
              `,
              variables: {
                tenantNames: tenantFilteredNames,
                state: this.state
              }
            })
            .then((result) => {
              if (this.state.connectionIssue) {
                this.state.getNetworkError('');
              }
              client
                .query({
                  query: gql`
                    query getUserPreferences($userName: String!) {
                      getUserPreferences(userName: $userName) {
                        userName
                        language
                        lastTenantSelected
                        welcomeText {
                          language
                          text
                        }
                      }
                    }
                  `,
                  variables: {
                    userName: this.props.idTokenPayload.sub,
                    state: this.state
                  }
                })
                .then((result) => {
                  this.state.setAppLanguage(result.data.getUserPreferences[0].language);
                  this.state.seTenant(result.data.getUserPreferences[0].lastTenantSelected);
                });
              this.setState({
                tenants: this.state.preferencesMapper(
                  result.data.listTenants !== null ? result.data.listTenants : [],
                  userTenants
                )
              });
              this.state.seTenant(this.state.thisTenant);
            });
        })
        .catch((e) => {
          if (e.message === 'Network Error') {
            this.state.getNetworkError(e.message, 'error');
          }
        });
    },
    afterLogin: (authenticated) => {
      if (authenticated) {
        const decoded = jwt_decode(this.props.accessToken);
        this.setState({ tokenData: decoded });
        this.state.getTenants();
      }
    }
  };
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (!this.props.isAuthenticated) {
      this.props.login();
    } else {
      this.state.afterLogin(this.props.isAuthenticated);
    }
  }

  handleDrawerOpen = () => {
    this.state.setOpenLateralMenu(true);
  };

  handleDrawerClose = () => {
    this.state.setOpenLateralMenu(false);
  };

  toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    this.setState({ open: open });
  };

  render() {
    return (
      <SnackbarProvider maxSnack={5} sx={{ zIndex: 90000 }}>
        <ThemeProvider theme={this.state.tenantColor}>
          <Box sx={{ display: 'flex' }}>
            <BrowserRouter>
              <CssBaseline />
              <AppBar position="fixed" open={this.state.openLateralMenu}>
                <CustomToolbar color="primary">
                  <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={this.handleDrawerOpen}
                    edge="start"
                    sx={{ mr: 2, ...(this.state.openLateralMenu && { display: 'none' }) }}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}></Typography>
                  <div>
                    {this.props.isAuthenticated && (
                      <TenantSelection
                        seTenant={this.state.seTenant}
                        tenantValues={this.state.tenants}
                        currentValue={this.state.thisTenant}
                      ></TenantSelection>
                    )}
                  </div>
                  <div>
                    {this.props.isAuthenticated && (
                      <UserMenu
                        env={env}
                        token={this.props.accessToken}
                        language={{
                          language: this.state.language,
                          setLanguage: this.state.setAppLanguage,
                          setHomeTitle: this.state.setHomeTitle
                        }}
                        userData={this.props.idTokenPayload}
                        lastTenantSelected={this.state.thisTenant}
                        tokenDecoded={this.state.tokenData}
                      ></UserMenu>
                    )}
                  </div>
                </CustomToolbar>
              </AppBar>
              <SwipeableDrawer
                sx={{
                  flexShrink: 0,
                  zIndex: 500000,
                  '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box'
                  }
                }}
                variant="persistent"
                open={this.state.openLateralMenu}
                onClose={this.toggleDrawer(false)}
                anchor={'left'}
                onOpen={this.toggleDrawer(true)}
              >
                <DrawerHeader>
                  <IconButton onClick={this.handleDrawerClose}>
                    {this.state.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                  </IconButton>
                </DrawerHeader>
                <Divider />
                {menu.map((item, key) => (
                  <MenuItem
                    key={key}
                    item={item}
                    tokenData={this.state.tokenData}
                    onClick={this.handleDrawerClose}
                    tenantValues={this.state.tenants}
                    thisTenant={this.state.thisTenant}
                  />
                ))}
                <Divider />
              </SwipeableDrawer>
              {this.props.isAuthenticated ? (
                <Main open={this.state.open} sx={{ mt: 10 }}>
                  <Container maxWidth="xl">
                    <Grid item xs={12} sm={12} md={12} lg={12} xl={12} id="filterContainer"></Grid>
                  </Container>
                  <Container maxWidth="xl">
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <HomePage
                            tokenData={this.state.tokenData}
                            env={env}
                            tenantValues={this.state.tenants}
                            thisTenant={this.state.thisTenant}
                            userData={this.props.idTokenPayload}
                            language={this.state.language}
                            token={this.props.accessToken}
                            homeTitle={this.state.homeTitle}
                          />
                        }
                      />
                      <Route
                        path="Tenant"
                        element={
                          <AuthorizedElement tokenDecoded={this.state.tokenData} iSuperAdmin={true} redirect={true}>
                            <TenantPage
                              token={this.props.accessToken}
                              renewTokens={this.props.renewTokens}
                              env={env}
                              getTenants={this.state.getTenants}
                              tenantValues={this.state.tenants}
                              seTenant={this.state.seTenant}
                              graphqlErrors={this.state.connectionIssue}
                            />
                          </AuthorizedElement>
                        }
                      />

                      <Route path="/restriction" element={<RestrictionPage />} />

                      <Route
                        path="Service"
                        element={
                          <AuthorizedElement
                            tokenDecoded={this.state.tokenData}
                            tenantValues={this.state.tenants}
                            thisTenant={this.state.thisTenant}
                            roleNeeded={'tenant-admin'}
                            iSuperAdmin={true}
                            redirect={true}
                          >
                            <ServicePage
                              getTenants={this.state.getTenants}
                              env={env}
                              tenantValues={this.state.tenants}
                              thisTenant={this.state.thisTenant}
                              graphqlErrors={this.state.connectionIssue}
                            />
                          </AuthorizedElement>
                        }
                      />
                      <Route
                        path="Policy"
                        element={
                          <PolicyPage
                            token={this.props.accessToken}
                            env={env}
                            getTenants={this.state.getTenants}
                            tenantValues={this.state.tenants}
                            thisTenant={this.state.thisTenant}
                            graphqlErrors={this.state.connectionIssue}
                          />
                        }
                      />
                      <Route
                        path="ResourceType"
                        element={
                          <AuthorizedElement
                            tokenDecoded={this.state.tokenData}
                            tenantValues={this.state.tenants}
                            thisTenant={this.state.thisTenant}
                            roleNeeded={'tenant-admin'}
                            iSuperAdmin={true}
                            redirect={true}
                          >
                            <ResourcePage
                              token={this.props.accessToken}
                              tokenData={this.state.tokenData}
                              env={env}
                              graphqlErrors={this.state.connectionIssue}
                              thisTenant={this.state.thisTenant}
                              tenantValues={this.state.tenants}
                            />
                          </AuthorizedElement>
                        }
                      />
                      <Route
                        path="Entity"
                        element={
                          <EntityPage
                            token={this.props.accessToken}
                            tokenData={this.state.tokenData}
                            env={env}
                            graphqlErrors={this.state.connectionIssue}
                            thisTenant={this.state.thisTenant}
                            tenantValues={this.state.tenants}
                            language={this.state.language}
                          />
                        }
                      />
                      <Route
                        path="Alarms"
                        element={
                          <AlarmsPage
                            getTenants={this.state.getTenants}
                            token={this.props.accessToken}
                            env={env}
                            tenantValues={this.state.tenants}
                            thisTenant={this.state.thisTenant}
                            graphqlErrors={this.state.connectionIssue}
                            language={this.state.language}
                          />
                        }
                      />

                      <Route path="403" element={<ErrorPage env={env} code="403" msg="common.notAuthorized" />} />
                      <Route path="*" element={<ErrorPage env={env} code="404" msg="common.notFound" />} />
                    </Routes>
                  </Container>
                </Main>
              ) : (
                <Main open={this.state.openLateralMenu} />
              )}
              <DrawerHeader />
            </BrowserRouter>
            {this.state.connectionIssue}
          </Box>
        </ThemeProvider>
      </SnackbarProvider>
    );
  }
}
