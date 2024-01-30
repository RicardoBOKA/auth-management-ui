import * as React from 'react';
import MainTitle from '../components/shared/mainTitle';
import AddButton from '../components/shared/addButton';
import { Grid } from '@mui/material';
import PolicyFilters from '../components/policy/policyFilters';
import PolicyTable from '../components/policy/policiesTable';
import PolicyForm from '../components/policy/policyForm';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { Trans } from 'react-i18next';
import useNotification from '../components/shared/messages/alerts';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import * as log from 'loglevel';
import * as tableApi from '../componentsApi/tableApi';

export default function PolicyPage({ getTenants, tenantValues, thisTenant, graphqlErrors, token, env }) {
  typeof env === 'undefined' ? log.setDefaultLevel('debug') : log.setLevel(env.LOG_LEVEL);

  const [mode, setMode] = React.useState(null);
  const [agent, setAgent] = React.useState(null);
  const [resource, setResource] = React.useState(null);
  const [resourceType, setResourceType] = React.useState(null);
  const [agentType, setAgentype] = React.useState(null);
  const [policyFilter, setPolicyFilter] = React.useState(null);

  const [open, setOpen] = React.useState(false);
  const [msg, sendNotification] = useNotification();
  log.debug(msg);

  //TABLE PART
  const [page, setPage] = React.useState(0);
  const [policiesLength, setPoliciesLenght] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(tableApi.getRowsPerPage(env));
  const pageMaxNumber = tableApi.getTableMax(env);
  React.useEffect(() => {
    thisTenant !== null ? getServices() : '';
  }, [page, rowsPerPage]);

  const GeTenantData = (type) => {
    const tenantArray = tenantValues.filter((e) => e.id === thisTenant);
    if (type === 'name') {
      return tenantArray[0].name;
    } else {
      return tenantArray[0].id;
    }
  };
  // services
  const [services, setServices] = React.useState([]);
  const getServices = () => {
    axios
      .get((typeof env !== 'undefined' ? env.ANUBIS_API_URL : '') + 'v1/tenants/' + thisTenant + '/service_paths', {
        headers: {
          // authorization: `Bearer ${token}`
        }
      })
      .then((response) => {
        log.debug(response.data);
        setServices(response.data);
        getPolicies(response.data);
        getPoliciesFiltered(response.data);
        getTenants();
      })
      .catch((e) => {
        getTenants();
        e.response
          ? e.response.data.detail.map((thisError) => sendNotification({ msg: thisError.msg, variant: 'error' }))
          : sendNotification({ msg: e.message + ': cannot reach policy managenent api', variant: 'error' });
      });
  };
  // policies
  const [policies, setPolicies] = React.useState([]);
  const getPolicies = (servicesResponse) => {
    let datAccumulator = [];
    for (const service of servicesResponse) {
      axios
        .get(
          (typeof env !== 'undefined' ? env.ANUBIS_API_URL : '') +
            'v1/policies' +
            '/?skip=' +
            page * (rowsPerPage === pageMaxNumber ? pageMaxNumber : rowsPerPage) +
            '&limit=' +
            rowsPerPage,
          {
            headers: {
              'fiware-service': GeTenantData('name'),
              'fiware-servicepath': service.path,
              authorization: `Bearer ${token}`
            }
          }
        )
        .then((response) => {
          response.data.forEach((e) => (e.fiware_service = GeTenantData('name')));
          response.data.forEach((e) => (e.fiware_service_path = service.path));
          datAccumulator = [...datAccumulator, ...response.data];
          setPolicies(datAccumulator);
        })
        .catch((e) => {
          e.response
            ? e.response.data.detail.map((thisError) => sendNotification({ msg: thisError.msg, variant: 'error' }))
            : sendNotification({ msg: e.message + ': cannot reach policy managenent api', variant: 'error' });
        });
    }
  };
  // policiesFiltered
  const [policiesFiltered, setPoliciesFiltered] = React.useState([]);
  const getPoliciesFiltered = (servicesResponse) => {
    const queryParameters =
      (mode !== null ? '&mode=' + mode.iri : '') +
      (resource !== null ? '&resource=' + resource.access_to : '') +
      (agent !== null ? '&agent=' + agent.iri : '') +
      (resourceType !== null ? '&resource_type=' + resourceType.resource_type : '') +
      (agentType !== null ? '&agent_type=' + agentType.iri : '');
    let datAccumulator = [];
    for (const service of servicesResponse) {
      axios
        .get(
          (typeof env !== 'undefined' ? env.ANUBIS_API_URL : '') +
            'v1/policies' +
            '/?skip=' +
            page * (rowsPerPage === pageMaxNumber ? pageMaxNumber : rowsPerPage) +
            '&limit=' +
            rowsPerPage +
            queryParameters,
          {
            headers: {
              'fiware-service': GeTenantData('name'),
              'fiware-servicepath': policyFilter !== null ? policyFilter.fiware_service_path : service.path,
              authorization: `Bearer ${token}`
            }
          }
        )
        .then((response) => {
          if (policyFilter === null) {
            setPoliciesLenght(response.headers['counter']);
            response.data.forEach((e) => (e.fiware_service = GeTenantData('name')));
            response.data.forEach((e) => (e.fiware_service_path = service.path));
            datAccumulator = [...datAccumulator, ...response.data];
            setPoliciesFiltered(datAccumulator);
          } else {
            setPoliciesLenght(response.headers['counter']);
            response.data.forEach((e) => (e.fiware_service = GeTenantData('name')));
            response.data.forEach((e) => (e.fiware_service_path = policyFilter.fiware_service_path));
            setPoliciesFiltered(response.data);
          }
        })
        .catch((e) => {
          if (e.response) {
            e.response.data.detail.map((thisError) => sendNotification({ msg: thisError.msg, variant: 'error' }));
          } else {
            sendNotification({ msg: e.message + ': cannot reach policy managenent api', variant: 'error' });
          }
        });
    }
    log.debug(policies);
  };

  const [access_modes, setAccess_modes] = React.useState([]);

  React.useEffect(() => {
    if (!(thisTenant === null || typeof thisTenant === 'undefined')) {
      getServices();
      axios
        .get((typeof env !== 'undefined' ? env.ANUBIS_API_URL : '') + 'v1/policies/access-modes', {
          headers: {
            authorization: `Bearer ${token}`
          }
        })
        .then((response) => setAccess_modes(response.data))
        .catch((err) =>
          sendNotification({ msg: err.message + ': cannot reach policy managenent api', variant: 'error' })
        );
    }
  }, [thisTenant]);

  const [agentsTypes, setagentsTypes] = React.useState([]);

  React.useEffect(() => {
    if (!(thisTenant === null || typeof thisTenant === 'undefined')) {
      getServices();
      axios
        .get((typeof env !== 'undefined' ? env.ANUBIS_API_URL : '') + 'v1/policies/agent-types', {
          headers: {
            authorization: `Bearer ${token}`
          }
        })
        .then((response) => setagentsTypes(response.data))
        .catch((err) =>
          sendNotification({ msg: err.message + ': cannot reach policy managenent api', variant: 'error' })
        );
    }
  }, [thisTenant]);

  const mainTitle = <Trans>policies.titles.page</Trans>;

  const filterMapper = {
    mode: {
      value: mode,
      set: setMode
    },
    agent: {
      value: agent,
      set: setAgent
    },
    resource: {
      value: resource,
      set: setResource
    },
    resourceType: {
      value: resourceType,
      set: setResourceType
    },
    agentType: {
      value: agentType,
      set: setAgentype
    },
    policy: {
      value: policyFilter,
      set: setPolicyFilter
    }
  };

  React.useEffect(() => {
    setMode(null);
    setAgent(null);
    setResource(null);
    setResourceType(null);
    setAgentype(null);
    setPolicyFilter(null);
  }, [thisTenant]);

  React.useEffect(() => {
    if (policies.length > 0) {
      getPoliciesFiltered(services);
    }
  }, [mode, agent, resource, resourceType, agentType, policyFilter]);
  const theme = useTheme();
  const smallDevice = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box>
      <MainTitle mainTitle={mainTitle}></MainTitle>
      {typeof thisTenant === 'undefined' || thisTenant === '' ? (
        ''
      ) : (
        <AddButton
          pageType={
            <PolicyForm
              tenantName={GeTenantData}
              action="create"
              agentsTypes={agentsTypes} //2
              services={services} //1
              getServices={getServices}
              access_modes={access_modes}
              title={<Trans>policies.titles.new</Trans>}
              close={setOpen}
              token={token}
              env={env}
              thisTenant={thisTenant}
              tenantValues={tenantValues}
            ></PolicyForm>
          }
          setOpen={setOpen}
          status={open}
          graphqlErrors={graphqlErrors}
        ></AddButton>
      )}
      {policies.length > 0 ? (
        <Grid container spacing={2}>
          <Grid
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
            xl={12}
            sx={
              smallDevice
                ? {
                    width:
                      document.getElementById('filterContainer') === null
                        ? 300
                        : document.getElementById('filterContainer').clientWidth,
                    'overflow-x': 'scroll'
                  }
                : ''
            }
          >
            <PolicyFilters
              data={policies}
              access_modes={access_modes}
              agentsTypes={agentsTypes}
              mapper={filterMapper}
              services={services}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
            <PolicyTable
              page={page}
              setPage={setPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              policiesLength={policiesLength}
              tenantName={GeTenantData}
              services={services}
              data={policiesFiltered}
              getData={getServices}
              access_modes={access_modes}
              agentsTypes={agentsTypes}
              token={token}
              env={env}
            ></PolicyTable>
          </Grid>
        </Grid>
      ) : (
        <Typography sx={{ padding: '20px' }} variant="h6" component="h3">
          <Trans>policies.titles.noData</Trans>
        </Typography>
      )}
    </Box>
  );
}
