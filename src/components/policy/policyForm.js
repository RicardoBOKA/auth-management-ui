import * as React from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { InputLabel } from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import { Trans } from 'react-i18next';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import Grow from '@mui/material/Grow';
import Zoom from '@mui/material/Zoom';
import FormHelperText from '@mui/material/FormHelperText';
import useNotification from '../shared/messages/alerts';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import log from 'loglevel';
import * as realmApi from '../../realmApi/getRealmData';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { useState } from 'react';
import RestrictionForm from '../restrictions/restrictionForm';
// import AddButton from '../shared/addButton';

const CustomDialogTitle = styled(AppBar)({
  position: 'relative',
  background: 'white',
  boxShadow: 'none'
});

export default function PolicyForm({
  title,
  close,
  action,
  tenantName,
  services, //1
  access_modes,
  agentsTypes, //2
  getServices,
  data, //3
  token,
  env,
  thisTenant,
  tenantValues
}) {
  const [msg, sendNotification] = useNotification();
  const [open, setOpen] = useState(false);

  const addRestriction = async (name, target_name, target_id, data) => {
    try {
      const response = await axios.post(
        `http://localhost:8085/v1/restrictions/?target_name=${target_name}&target_id=${target_id}`,
        {
          name: name,
          data: JSON.stringify(data)
        },
        {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Restriction ajoutée :', response.data);
      setOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la restriction :", error);
    }
  };

  typeof env === 'undefined' ? log.setDefaultLevel('debug') : log.setLevel(env.LOG_LEVEL);
  const httpLink = createHttpLink({
    uri: typeof env !== 'undefined' ? env.CONFIGURATION_API_URL : ''
  });
  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`
      }
    };
  });
  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache({ addTypename: false })
  });
  const anubisURL = typeof env !== 'undefined' ? env.ANUBIS_API_URL : '';
  log.debug(msg);
  const handleClose = () => {
    close(false);
  };

  //errorLog
  const [error, setError] = React.useState(null);

  // SERVICE PATH
  const [path, setPath] = React.useState(action === 'create' ? '' : data.fiware_service_path);

  const handlePath = (event) => {
    setPath(event.target.value);
  };

  // RESOURCE
  const [resource, setResource] = React.useState(action === 'create' ? [] : [data.resource_type]);
  const [limitTheNumberOfValues, setLimitTheNumberOfValues] = React.useState(action === 'create' ? false : true);
  const [resources, setResources] = React.useState([]);
  const handleResource = (event, value) => {
    switch (true) {
      case value.length === 1 && resource.length === 0:
        setResource(value);
        setLimitTheNumberOfValues(true);
        getTheEndPoints(value[0]);
        break;
      case value.length === 0 && resource.length === 1:
        setResource(value);
        setLimitTheNumberOfValues(false);
        setAccess('');
        getTheEndPoints(value[0]);
        break;
    }
  };

  // ACCESS
  const [access, setAccess] = React.useState(action === 'create' ? '' : data.access_to);
  const [accessList, setAccessList] = React.useState([
    { name: '*', value: '*' },
    { name: 'default', value: 'default' }
  ]);
  const handleAccess = (event) => {
    setAccess(event.target.value);
  };

  const handleAccessAutocomplete = (event, data) => {
    setAccess(data.value);
  };

  React.useEffect(() => {
    getTheResources();

    if (action === 'create') {
      setAccess('');
      setAccessList([]);
    }
  }, []);

  React.useEffect(() => {
    const data = action === 'modify' ? resource[0] : '';
    const areThisValuesInside = resources.filter((e) => e.name === data);
    areThisValuesInside.length > 0 ? getTheEndPoints(resource[0]) : setAccessList([]);
  }, [resources]);

  // MODE
  const [mode, setMode] = React.useState(action === 'create' ? [] : data.mode);

  const handleMode = (event) => {
    setMode(event.target.value);
  };

  const checkAgenTypes = (arr, values) => {
    return values.every((value) => {
      return arr.includes(value);
    });
  };

  const specificAgenTypes = ['acl:AuthenticatedAgent', 'foaf:Agent', 'oc-acl:ResourceTenantAgent'];
  const [formType, setFormType] = React.useState(
    action === 'create' ? '' : checkAgenTypes(specificAgenTypes, data.agent) ? 'others' : 'specific'
  );

  const handleFormType = (event) => {
    setFormType(event.target.value);
    setAgentsMap([]);
  };

  // AGENT
  const [agentOthers, setAgentOthers] = React.useState(action === 'create' ? [] : data.agent);

  const handleAgentOthers = (event) => {
    setAgentOthers(event.target.value);
  };
  const createAgentMap = (agents) => {
    let newMap = [];
    for (let agent of agents) {
      const agentName = agent.split(':').slice('2').join(':');
      const agenType = agent.replace(':' + agentName, '');
      newMap.push({ type: agenType, name: agentName });
    }
    return newMap;
  };
  const [agentsMap, setAgentsMap] = React.useState(action === 'create' ? [] : createAgentMap(data.agent));

  // AGENT

  React.useEffect(() => {
    setAgentsMap(agentsMap);
  }, [agentsMap]);

  const handleAgentsName = (event, value) => {
    const newArray = agentsMap;
    agentsMap[Number(value.mapper)].name = value.value;
    setAgentsMap([...[], ...newArray]);
  };
  const handleAgentsType = (event) => {
    const newArray = agentsMap;
    newArray[Number(event.target.name)].type = event.target.value;
    newArray[Number(event.target.name)].name = '';
    setAgentsMap([...[], ...newArray]);
  };
  const addAgents = () => {
    setAgentsMap([...agentsMap, { type: null, name: '' }]);
  };

  const addRestr = () => {
    setOpen((open) => !open);
  };

  const removeAgents = (index) => {
    const newArray = agentsMap;
    newArray.splice(index, 1);
    setAgentsMap([...[], ...newArray]);
  };

  const agentMapper = () => {
    const agentMapped = [];
    if (formType === 'specific') {
      for (const thisAgent of agentsMap) {
        agentMapped.push(thisAgent.type + ':' + thisAgent.name);
      }
      console.log('agentsMap = ', agentsMap);
      return agentMapped;
    } else {
      console.log('agentOthers = ', agentOthers);
      return agentOthers;
    }
  };

  const handleSave = () => {
    switch (action) {
      case 'create':
        axios
          .post(
            anubisURL + 'v1/policies/',
            {
              access_to: access,
              resource_type: resource[0],
              mode,
              agent: agentMapper()
            },
            {
              headers: {
                'fiware-service': tenantName('name'),
                'fiware-servicepath': path,
                authorization: `Bearer ${token}`
              }
            }
          )
          .then(() => {
            if (open) {
              //Si on a une restriction, => post la restriciton aussi.e
            }
          })
          .then(() => {
            getServices();
            close(false);
            sendNotification({
              msg: (
                <Trans
                  i18nKey="common.messages.sucessCreate"
                  values={{
                    data: 'Policy'
                  }}
                />
              ),
              variant: 'success'
            });
          })
          .catch((e) => {
            getServices();
            setError(e);
            e.response.data.detail.map((thisError) => sendNotification({ msg: thisError.msg, variant: 'error' }));
          });
        break;
      case 'modify':
        axios
          .put(
            anubisURL + 'v1/policies/' + data.id,
            {
              access_to: access,
              resource_type: resource[0],
              mode,
              agent: agentMapper()
            },
            {
              headers: {
                policy_id: data.id,
                'fiware-service': tenantName('name'),
                'fiware-servicepath': path,
                authorization: `Bearer ${token}`
              }
            }
          )
          .then(() => {
            getServices();
            close(false);
            sendNotification({
              msg: (
                <Trans
                  i18nKey="common.messages.sucessUpdate"
                  values={{
                    data: data.id
                  }}
                />
              ),
              variant: 'success'
            });
          })
          .catch((e) => {
            getServices();
            setError(e);
            e.response.data.detail.map((thisError) => sendNotification({ msg: thisError.msg, variant: 'error' }));
          });
        break;
      default:
        break;
    }
  };
  const getLabelName = (name) => {
    switch (name) {
      case 'acl:agent':
        return <Trans>policies.form.agent</Trans>;
      case 'acl:agentGroup':
        return <Trans>policies.form.agentGroup</Trans>;
      case 'acl:agentClass':
        return <Trans>policies.form.agentClass</Trans>;
      default:
        break;
    }
  };

  // const thisTenant = [{ id: '7eab84c1-940b-4eeb-bf6a-10a125b01db3' }];

  // const tenantValues = [
  //   {
  //     name: 'Tenant4',
  //     id: '7eab84c1-940b-4eeb-bf6a-10a125b01db3',
  //     service_paths: [
  //       {
  //         path: '/',
  //         id: '790fac28-feed-4283-83d4-08653a43876b',
  //         tenant_id: '7eab84c1-940b-4eeb-bf6a-10a125b01db3',
  //         parent_id: null,
  //         scope: null,
  //         children: []
  //       }
  //     ],
  //     props: {
  //       name: 'Tenant4',
  //       icon: 'none',
  //       primaryColor: '#8086ba',
  //       secondaryColor: '#8086ba'
  //     }
  //   }
  // ];

  const [dataModel, setDataModel] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(!loading);
  }, [dataModel]);

  const getLabelData = async (name, mapper) => {
    setDataModel([]);
    let model = [];
    let dataMatrix = [];
    switch (name) {
      case 'acl:agent':
        await realmApi
          .allUsers(token, env)
          .then((data) => {
            data.map((thisName) =>
              dataMatrix.push({
                name: typeof thisName.email === 'undefined' ? thisName.username : thisName.email,
                value: typeof thisName.email === 'undefined' ? thisName.username : thisName.email,
                mapper: mapper
              })
            );
            setDataModel(dataMatrix);
          })
          .catch(() => setDataModel([]));
        break;
      case 'acl:agentGroup':
        await realmApi
          .getSubGroups(tenantName('id'), token, env)
          .then((data) => {
            data.subGroups.map((thisGroup) =>
              dataMatrix.push({
                name: thisGroup.path.replace('/' + tenantName('name'), ''),
                value: thisGroup.path.replace('/' + tenantName('name'), ''),
                mapper: mapper
              })
            );
            setDataModel(dataMatrix);
          })
          .catch(() => setDataModel([]));
        break;
      case 'acl:agentClass':
        await realmApi
          .getAllRoles(token, env)
          .then((data) => {
            data.map((thisClass) => model.push({ name: thisClass, value: thisClass, mapper: mapper }));
            setDataModel(model);
          })
          .catch(() => setDataModel([]));
        break;
      default:
        return [];
    }
  };

  const getTheResources = () => {
    client
      .query({
        query: gql`
          query getTenantResourceType($tenantName: String!, $skip: Int!, $limit: Int!) {
            getTenantResourceType(tenantName: $tenantName, skip: $skip, limit: $limit) {
              data {
                name
                userID
                tenantName
                endpointUrl
                ID
              }
              count
            }
          }
        `,
        variables: { tenantName: tenantName('name'), skip: resources.length, limit: 100 }
      })
      .then((response) => {
        resources.length < response.data.getTenantResourceType.count
          ? setResources([...resources, ...response.data.getTenantResourceType.data])
          : '';
      })
      .catch((e) => {
        sendNotification({ msg: e.message + ' the config', variant: 'error' });
      });
  };

  const getTheEndPoints = (resourceTypeName) => {
    const areThisValuesInside = resources.filter((e) => e.name === resourceTypeName);
    if (areThisValuesInside.length > 0) {
      axios
        .get(areThisValuesInside[0].endpointUrl, {
          headers: {
            'fiware-Service': tenantName('name'),
            'fiware-ServicePath': path
          }
        })
        .then((response) => {
          let dataToPush = [{ id: 'ID' }];
          response.data.map((e) => dataToPush.push({ name: e.id, value: e.id }));
          setAccessList([
            ...dataToPush,
            ...[
              { name: '*', value: '*' },
              { name: 'default', value: 'default' }
            ]
          ]);
          setAccess('');
        })
        .catch((e) => {
          setAccessList([
            { name: '*', value: '*' },
            { name: 'default', value: 'default' }
          ]);
          setAccess('');
          setError(e);
        });
    }
  };

  const errorCases = (value) => {
    if (error !== null) {
      switch (true) {
        case value === '' || typeof value === 'undefined' || value === null:
          return true;
        case value.length === 0:
          return true;
        case value === 'specific' && (agentsMap.length === 0 || agentsMap[0].type === null || agentsMap[0].name === ''):
          return true;
        default:
          return false;
      }
    } else {
      return false;
    }
  };
  const errorText = (value) => {
    if (error !== null) {
      switch (true) {
        case value === '' || typeof value === 'undefined' || value === null:
          return <Trans>common.errors.mandatory</Trans>;
        case value.length === 0:
          return <Trans>common.errors.mandatory</Trans>;
        case value === 'specific' && (agentsMap.length === 0 || agentsMap[0].type === null || agentsMap[0].name === ''):
          return <Trans>common.errors.userMap</Trans>;
        default:
          return false;
      }
    } else {
      return false;
    }
  };

  const theme = useTheme();
  const isResponsive = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <div>
      <CustomDialogTitle>
        <Toolbar>
          <IconButton edge="start" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1, color: 'black' }} noWrap gutterBottom variant="h6" component="div">
            {title}
          </Typography>
          <Button autoFocus color="secondary" onClick={handleSave}>
            <Trans>common.saveButton</Trans>
          </Button>
        </Toolbar>
      </CustomDialogTitle>
      <DialogContent sx={{ minHeight: '400px' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              id="Service"
              label="Service"
              variant="outlined"
              defaultValue={tenantName('name')}
              disabled
              sx={{
                width: '100%'
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom component="div" color="primary">
              <Trans>policies.form.mainTitle</Trans>
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="path" error={errorCases(path)}>
                {' '}
                <Trans>policies.form.servicePath</Trans>
              </InputLabel>
              <Select
                labelId="path"
                id="path"
                variant="outlined"
                value={path}
                label={<Trans>policies.form.servicePath</Trans>}
                onChange={handlePath}
                error={errorCases(path)}
              >
                {services.map((service, index) => (
                  <MenuItem key={index} value={service.path}>
                    {service.path}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText error={errorCases(path)}>{errorText(path)}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              id="tags-filled"
              color="primary"
              options={resources.map((option) => option.name)}
              loading={loading}
              onOpen={() => getTheResources()}
              fullWidth={true}
              freeSolo={!limitTheNumberOfValues}
              getOptionDisabled={() => (limitTheNumberOfValues ? true : false)}
              defaultValue={action === 'create' ? [] : resource}
              onChange={(event, value) => handleResource(event, value)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" key={index} label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} variant="outlined" label={<Trans>policies.form.resourceType</Trans>} />
              )}
            />
          </Grid>
          {accessList.length > 0 ? (
            <Grid item xs={12}>
              <Autocomplete
                disablePortal
                color="secondary"
                key={'accessName'}
                variant="outlined"
                options={accessList}
                fullWidth={true}
                defaultValue={
                  action === 'create' ? { name: 'default', value: 'default' } : { name: access, value: access }
                }
                onChange={(event, value) => handleAccessAutocomplete(event, value)}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderInput={(params) => <TextField {...params} label={<Trans>policies.form.resource</Trans>} />}
              />
            </Grid>
          ) : (
            <Grid item xs={12}>
              <TextField
                id="access"
                variant="outlined"
                value={access}
                label={<Trans>policies.form.resource</Trans>}
                onChange={handleAccess}
                sx={{
                  width: '100%'
                }}
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="mode" error={errorCases(mode)}>
                <Trans>policies.form.mode</Trans>
              </InputLabel>

              <Select
                labelId="mode"
                id="mode"
                variant="outlined"
                value={mode}
                label={<Trans>policies.form.mode</Trans>}
                multiple
                input={<OutlinedInput label="Mode" />}
                onChange={handleMode}
                error={errorCases(mode)}
              >
                {access_modes.map((service) => (
                  <MenuItem key={service.iri} value={service.iri}>
                    {service.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText error={errorCases(mode)}>{errorText(mode)}</FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom component="div" color="primary">
              <Trans>policies.form.actorTitle</Trans>
            </Typography>
          </Grid>
          <Grid item xs={12} sx={{ marginBottom: '2%' }}>
            <FormControl fullWidth>
              <InputLabel id="FormType" error={errorCases(formType)}>
                <Trans>policies.form.userType</Trans>
              </InputLabel>
              <Select
                color="secondary"
                labelId="FormType"
                id="FormType"
                variant="outlined"
                value={formType}
                label={<Trans>policies.form.userType</Trans>}
                onChange={handleFormType}
                error={errorCases(formType)}
              >
                <MenuItem value={'specific'}>Specific</MenuItem>
                <MenuItem value={'others'}>Others</MenuItem>
              </Select>
              <FormHelperText error={errorCases(formType)}>{errorText(formType)}</FormHelperText>
            </FormControl>
          </Grid>
          <Zoom
            in={formType !== '' && formType === 'specific'}
            style={{ transformOrigin: '0 0 0' }}
            {...(formType !== '' && formType !== 'specific' ? { timeout: 500 } : {})}
          >
            <Grid
              item
              xs={12}
              sx={{
                display: formType !== '' && formType === 'specific' ? 'block' : 'none'
              }}
            >
              <Grid container spacing={6}>
                {agentsMap.map((agent, i) => (
                  <React.Fragment key={i}>
                    <Grid item xs={12} sm={12} md={2} lg={2} xl={2}></Grid>
                    <Grid item xs={12} sm={12} md={11} lg={10} xl={10}>
                      <Grid container spacing={12} direction="row" justifyContent="center" alignItems="center">
                        <Grid item xs={9} sm={9} md={10} lg={10} xl={10}>
                          <Grid container spacing={isResponsive ? 2 : 4}>
                            <Grid item xs={12}>
                              <FormControl fullWidth>
                                <InputLabel id={'User' + i} error={errorCases(agent.type)}>
                                  <Trans>policies.form.user</Trans>
                                </InputLabel>
                                <Select
                                  color="secondary"
                                  labelId={'User' + i}
                                  id={'User' + i}
                                  name={i}
                                  key={'User' + i}
                                  value={agent.type}
                                  variant="outlined"
                                  onChange={handleAgentsType}
                                  label={<Trans>policies.form.user</Trans>}
                                  input={<OutlinedInput label="Mode" />}
                                  error={errorCases(agent.type)}
                                >
                                  {agentsTypes.map((agents) => (
                                    <MenuItem key={agents.iri} value={agents.iri}>
                                      {agents.name}
                                    </MenuItem>
                                  ))}
                                </Select>
                                <FormHelperText error={errorCases(agent.type)}>{errorText(agent.type)}</FormHelperText>
                              </FormControl>
                            </Grid>
                            <Grow
                              in={agent.type !== null}
                              style={{ transformOrigin: '0 0 0' }}
                              {...(agent.type !== null ? { timeout: 500 } : {})}
                            >
                              <Grid
                                item
                                xs={12}
                                sx={{
                                  display: agent.type !== null ? 'block' : 'none'
                                }}
                              >
                                <Autocomplete
                                  disablePortal
                                  color="secondary"
                                  id={'actorName' + i.toString()}
                                  key={'actorName' + i.toString()}
                                  variant="outlined"
                                  options={dataModel}
                                  loading={loading}
                                  onOpen={() => getLabelData(agent.type, i.toString())}
                                  fullWidth={true}
                                  value={
                                    typeof agent.name === 'undefined'
                                      ? null
                                      : { name: agent.name, value: agent.name, mapper: i.toString() }
                                  }
                                  onChange={(event, value) => handleAgentsName(event, value)}
                                  getOptionLabel={(option) => option.name}
                                  isOptionEqualToValue={(option, value) => option.value === value.value}
                                  renderInput={(params) => <TextField {...params} label={getLabelName(agent.type)} />}
                                />
                              </Grid>
                            </Grow>
                          </Grid>
                        </Grid>
                        <Grid item xs={3} sm={3} md={2} lg={2} xl={2}>
                          <Grid
                            container
                            direction="row"
                            justifyContent="center"
                            alignItems="center"
                            spacing={isResponsive ? 1 : 2}
                          >
                            <Tooltip title={<Trans>common.deleteTooltip</Trans>}>
                              <IconButton
                                aria-label="delete"
                                size="large"
                                onClick={() => {
                                  removeAgents(i);
                                }}
                              >
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </React.Fragment>
                ))}
                <Grid item xs={12}>
                  {' '}
                  <Grid container direction="row" justifyContent="center" alignItems="center" spacing={0}>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        addAgents();
                      }}
                    >
                      New Actor
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Zoom>
          <Zoom
            in={formType !== '' && formType === 'others'}
            style={{ transformOrigin: '0 0 0' }}
            {...(formType !== '' && formType !== 'others' ? { timeout: 500 } : {})}
          >
            <Grid
              item
              xs={12}
              sx={{
                display: formType !== '' && formType === 'others' ? 'block' : 'none'
              }}
            >
              <Grid item xs={12}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="ActorOthers" error={errorCases(agentOthers)}>
                      <Trans>policies.form.defaultActor</Trans>
                    </InputLabel>
                    <Select
                      color="secondary"
                      labelId="ActorOthers"
                      id="ActorOthers"
                      variant="outlined"
                      value={agentOthers}
                      label={<Trans>policies.form.defaultActor</Trans>}
                      multiple
                      input={<OutlinedInput label="ActorOthers" />}
                      onChange={handleAgentOthers}
                      error={errorCases(agentOthers)}
                    >
                      <MenuItem value={'acl:AuthenticatedAgent'}>Authenticated Actor</MenuItem>
                      <MenuItem value={'foaf:Agent'}>Anyone</MenuItem>
                      <MenuItem value={'oc-acl:ResourceTenantAgent'}>Resource Tenant Agent</MenuItem>
                    </Select>
                    <FormHelperText error={errorCases(agentOthers)}>{errorText(agentOthers)}</FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Zoom>
        </Grid>
        <Grid>
          {open && (
            <Grid>
              <RestrictionForm
                onClose={() => setOpen(false)}
                onAddRestriction={addRestriction}
                thisTenant={thisTenant}
                tenantValues={tenantValues}
                restrictionPage={false}
                agent={agentMapper()}
                action={'create'}
                // agent={}
                // service={}
              />
            </Grid>
          )}
          <Grid
            container
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={0}
            style={{ marginTop: '30px' }}
          >
            <Button
              variant="outlined"
              startIcon={!open ? <AddIcon /> : ''}
              onClick={() => {
                addRestr();
              }}
            >
              {open ? 'Remove Restriction' : 'Add Restriction'}
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
    </div>
  );
}
