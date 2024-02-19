import React, { useEffect, useState } from 'react';
import { Grid, Button, TextField, Autocomplete, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';
import * as realmApi from '../../realmApi/getRealmData';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import { Trans } from 'react-i18next';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import Grow from '@mui/material/Grow';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function RestrictionForm({
  onClose,
  thisTenant,
  tenantValues,
  tenantName,
  setNewRestr,
  agentsTypes,
  env,
  token,
  action,
  data
}) {
  const [target_name, setTarget_Name] = useState(['']);
  const [value, setValue] = useState(['']);
  const [target_id, setTarget_Id] = useState(['']);
  const [name, setName] = useState('');
  const [putData, setPutData] = useState();

  const [services, setServices] = useState(['']);
  const [policies, setPolicies] = useState(['']);
  const [dataModel, setDataModel] = React.useState([]);

  const theme = useTheme();
  const isResponsive = useMediaQuery(theme.breakpoints.down('sm'));

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

  const policiesTargets = async (tenant_id) => {
    const tenantName = tenantValues.find((tenant) => tenant.id === tenant_id).name;
    try {
      const response = await axios.get(`http://localhost:8085/v1/policies/?skip=0&limit=1000`, {
        headers: {
          Accept: '*/*',
          'fiware-service': tenantName,
          'fiware-servicepath': '/#'
        }
      });
      setPolicies(response.data);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la restriction :", error);
    }
  };

  const servicePathTargets = (tenant_id) => {
    try {
      const tenant = tenantValues.find((tenant) => tenant.id === tenant_id);
      setServices(tenant.service_paths);
    } catch (error) {
      console.log('Erreu', error);
    }
  };

  useEffect(() => {
    servicePathTargets(thisTenant);
  }, [thisTenant]);

  useEffect(() => {
    policiesTargets(thisTenant);
  }, [target_name]);

  const getAutocomplete = () => {
    switch (target_name) {
      case 'ServicePath':
        return (
          <Grid>
            {/* <Typography variant="subtitle1" gutterBottom component="div" color="primary">
              <Trans>restriction.form.service</Trans>
            </Typography> */}
            <Autocomplete
              disablePortal
              id="service_paths"
              options={services}
              sx={{ marginBottom: 2, width: '100%' }}
              getOptionLabel={(option) => (option.path ? option.path : '')}
              getOptionSelected={(option, value) => option.path === value.path}
              renderInput={(params) => <TextField {...params} label="Paths from current Tenant" />}
              onChange={(event, newValue) => setTarget_Id(newValue.id || '')}
              value={services.find((option) => option.id === target_id) || null}
            />
            <TextField
              type="text"
              id="target id"
              label="Target ID"
              variant="outlined"
              value={target_id}
              onChange={(e) => setTarget_Id(e.target.value)}
              sx={{ marginBottom: 2, width: '100%' }}
            />
          </Grid>
        );
      case 'Policy':
        return (
          <Grid>
            {/* <Typography variant="subtitle1" gutterBottom component="div" color="primary">
              <Trans>restriction.form.policy</Trans>
            </Typography> */}
            <Autocomplete
              disablePortal
              id="policies"
              options={policies}
              sx={{ marginBottom: 2, width: '100%' }}
              getOptionLabel={(option) => (option.id ? option.id : '')}
              getOptionSelected={(option, value) => option.id === value.id}
              renderInput={(params) => <TextField {...params} label="Policies from current Tenant" />}
              onChange={(event, newValue) => setTarget_Id(newValue.id || '')}
              value={policies.find((option) => option.id === target_id) || null}
            />
          </Grid>
        );
      case 'Agent':
        return (
          <Grid>
            <Grid item xs={12} sx={{ marginBottom: '2%' }}>
              <FormControl fullWidth>
                <InputLabel id="FormType">
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
                >
                  <MenuItem value={'specific'}>Specific</MenuItem>
                  <MenuItem value={'others'}>Others</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid>
              {formType === 'specific' ? (
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
                                  <InputLabel id={'User' + i}>
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
                                    // error={errorCases(agent.type)}
                                  >
                                    {agentsTypes.map((agents) => (
                                      <MenuItem key={agents.iri} value={agents.iri}>
                                        {agents.name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                  {/* <FormHelperText>{errorText(agent.type)}</FormHelperText> */}
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
              ) : formType === 'others' ? (
                <Grid item xs={12} sx={{ marginBottom: 2, width: '100%' }}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="ActorOthers">
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
                        // error={errorCases(agentOthers)}
                      >
                        <MenuItem value={'acl:AuthenticatedAgent'}>Authenticated Actor</MenuItem>
                        <MenuItem value={'foaf:Agent'}>Anyone</MenuItem>
                        <MenuItem value={'oc-acl:ResourceTenantAgent'}>Resource Tenant Agent</MenuItem>
                      </Select>
                      {/* <FormHelperText error={errorCases(agentOthers)}>{errorText(agentOthers)}</FormHelperText> */}
                    </FormControl>
                  </Grid>
                </Grid>
              ) : (
                ''
              )}
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  const dataObj = (dataData) => {
    try {
      const dataObject = JSON.parse(dataData);
      const type = dataObject.type;

      const newObj = { type, value };
      const newJsonString = JSON.stringify(newObj);

      setPutData(newJsonString);
    } catch (error) {
      console.error("Erreur lors de l'analyse de JSON :", error);
      setPutData('');
    }
  };

  React.useEffect(() => {
    if (action === 'modify') {
      dataObj(data.data);
    }
  }, [value]);

  const dataValueObj = (dataData) => {
    try {
      const dataObject = JSON.parse(dataData);
      setValue(dataObject.value || '');
    } catch (error) {
      console.error("Erreur lors de l'analyse de JSON :", error);
      setValue('');
    }
  };

  React.useEffect(() => {
    if (action === 'modify' && data) {
      setTarget_Name(data.target_name || '');
      setTarget_Id(data.target_id || '');
      setName(data.name || '');
      dataValueObj(data.data);
    }
  }, [data]);

  //
  // const errorCases = (value) => {
  //   if (error !== null) {
  //     switch (true) {
  //       case value === '' || typeof value === 'undefined' || value === null:
  //         return true;
  //       case value.length === 0:
  //         return true;
  //       case value === 'specific' && (agentsMap.length === 0 || agentsMap[0].type === null || agentsMap[0].name === ''):
  //         return true;
  //       default:
  //         return false;
  //     }
  //   } else {
  //     return false;
  //   }
  // };

  // const errorText = (value) => {
  //   if (error !== null) {
  //     switch (true) {
  //       case value === '' || typeof value === 'undefined' || value === null:
  //         return <Trans>common.errors.mandatory</Trans>;
  //       case value.length === 0:
  //         return <Trans>common.errors.mandatory</Trans>;
  //       case value === 'specific' && (agentsMap.length === 0 || agentsMap[0].type === null || agentsMap[0].name === ''):
  //         return <Trans>common.errors.userMap</Trans>;
  //       default:
  //         return false;
  //     }
  //   } else {
  //     return false;
  //   }
  // };

  const [loading, setLoading] = React.useState(true);
  const [formType, setFormType] = React.useState('');

  const parseStringToAgentsMap = (formattedString) => {
    if (!formattedString) return [];

    const items = formattedString.split(', ');

    const agentsArray = items.map((item) => {
      const separatorIndex = item.indexOf(':');
      if (separatorIndex === -1) {
        return { type: '', name: '' };
      }

      const type = item.substring(0, separatorIndex);
      const name = item.substring(separatorIndex + 1);

      return { type, name };
    });
    console.log('agentsArray = ', agentsArray);
    return agentsArray;
  };

  const [agentsMap, setAgentsMap] = React.useState(action === 'create' ? [] : parseStringToAgentsMap(data.target_id));
  const [agentOthers, setAgentOthers] = React.useState(action === 'create' ? [] : data.target_id);

  const updateTargetIdFromString = () => {
    const formattedString = agentsMap.map((agent) => `${agent.type}:${agent.name}`).join(', ');
    setTarget_Id(formattedString);
  };

  const handleAgentsType = (event) => {
    const newArray = agentsMap;
    newArray[Number(event.target.name)].type = event.target.value;
    newArray[Number(event.target.name)].name = '';
    setAgentsMap([...[], ...newArray]);
    updateTargetIdFromString();
  };

  const handleAgentsName = (event, value) => {
    const newArray = agentsMap;
    agentsMap[Number(value.mapper)].name = value.value;
    setAgentsMap([...[], ...newArray]);
    // setTarget_Id([...[], ...newArray]);
    updateTargetIdFromString();
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

  const removeAgents = (index) => {
    const newArray = agentsMap;
    newArray.splice(index, 1);
    setAgentsMap([...[], ...newArray]);
    // setTarget_Id([...[], ...newArray]);
    updateTargetIdFromString();
  };

  React.useEffect(() => {
    setLoading(!loading);
  }, [dataModel]);

  const handleAgentOthers = (event) => {
    setAgentOthers(event.target.value);
    setTarget_Id(event.target.value);
  };

  const addAgents = () => {
    console.log('agntsMap', agentsMap);
    setAgentsMap([...agentsMap, { type: null, name: '' }]);
    // setTarget_Id([...agentsMap, { type: null, name: '' }]);
    updateTargetIdFromString();
  };

  const handleFormType = (event) => {
    setFormType(event.target.value);
    setAgentsMap([]);
  };

  const handleAutocompleteChange = (event, newValue) => {
    setName(newValue.name);
  };
  const handleClose = () => {
    onClose();
  };
  const targets = [{ target: 'ServicePath' }, { target: 'Policy' }, { target: 'Agent' }];
  const options = [
    { name: 'Counter Restriction', type: 'integer' },
    { name: 'Mount Restriction', type: 'float' },
    { name: 'Duration Restriction', type: 'time' },
    { name: 'Start Time Restriction', type: 'time' },
    { name: 'End Time Restriction', type: 'time' },
    { name: 'Start Date Restriction', type: 'datetime' },
    { name: 'End Date Restriction', type: 'datetime' },
    { name: 'Location Restriction', type: 'string' },
    { name: 'Role Restriction', type: 'string' },
    { name: 'State Restriction', type: 'string' }
  ];
  function getDataTypeForRestriction() {
    const selectedOption = options.find((option) => option.name === name);
    const dataType = selectedOption ? selectedOption.type : 'string';
    return dataType;
  }

  const handlePut = async (data) => {
    console.log('Updated data : ', data);
    try {
      const response = await axios.put(
        `http://localhost:8085/v1/restrictions/${data.id}`,
        {
          name: name,
          data: putData
        },
        {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json'
          }
        }
      );
      setNewRestr((old) => !old);
      console.log('Update response =', response);
      handleClose();
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
      throw error;
    }
  };

  const handleSave = async () => {
    console.log('cococococo');
    const dataType = getDataTypeForRestriction();
    const dataPayload = {
      type: dataType,
      value: value
    };
    try {
      const response = await axios.post(
        `http://localhost:8085/v1/restrictions/?target_name=${target_name}&target_id=${target_id}`,
        {
          name: name,
          data: JSON.stringify(dataPayload)
        },
        {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json'
          }
        }
      );
      setNewRestr((old) => !old);
      console.log('REPONSE =', response);
      handleClose();
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
      throw error.response;
    }
  };

  return (
    <div>
      <DialogContent>
        <Grid>
          <h2>New Restriction</h2>
          <Typography variant="subtitle1" gutterBottom component="div" color="primary">
            <Trans>restriction.form.name</Trans>
          </Typography>
          <Autocomplete
            disablePortal
            id="restriction-name"
            options={options}
            sx={{ marginBottom: 2, width: '100%' }}
            getOptionLabel={(option) => (option.name ? option.name : name)}
            getOptionSelected={(option, value) => option.name === value.name}
            renderInput={(params) => <TextField {...params} label="Restriction" />}
            onChange={handleAutocompleteChange}
            value={options.find((option) => option.name === name) || null}
          />
        </Grid>
        {action === 'create' ? (
          <Grid>
            {/* <FormControl fullWidth>
              <InputLabel id="target-select-label">Target</InputLabel>
              <Select
                labelId="target-select-label"
                id="target-select"
                value={target_name}
                label="Target"
                onChange={(event) => setTarget_Name(event.target.value)}
                sx={{ marginBottom: 2 }}
              >
                {targets.map((option, index) => (
                  <MenuItem key={index} value={option.target}>
                    {option.target}
                  </MenuItem>
                ))}
              </Select>
            </FormControl> */}
            {/* OR */}
            <Typography variant="subtitle1" gutterBottom component="div" color="primary">
              <Trans>restriction.form.target</Trans>
            </Typography>
            <Autocomplete
              disablePortal
              id="targets"
              options={targets}
              sx={{ marginBottom: 2, width: '100%' }}
              getOptionLabel={(option) => (option.target ? option.target : '')}
              isOptionEqualToValue={(option, value) => option.target === value.target}
              renderInput={(params) => <TextField {...params} label="Target" />}
              onChange={(event, newValue) => setTarget_Name(newValue ? newValue.target : '')}
              value={targets.find((option) => option.target === target_name) || null}
            />
          </Grid>
        ) : (
          ''
        )}
        {getAutocomplete()}
        <Grid>
          <Typography variant="subtitle1" gutterBottom component="div" color="primary">
            <Trans>restriction.form.value</Trans>
          </Typography>
          <TextField
            type="text"
            id="value"
            label="Value"
            variant="outlined"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            sx={{ marginBottom: 2, width: '25%' }}
          />
        </Grid>
        <Grid>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (action === 'create') {
                handleSave();
              } else {
                handlePut(data).catch((error) => {
                  console.error('Erreur lors de la mise à jour :', error);
                });
              }
            }}
            // onClick={() => (action === 'create' ? handleSave() : handlePut(data).catch(error => {console.log('errrrrreur', error.response ? error.response : error)}))}
          >
            Add the restriction
          </Button>
        </Grid>
      </DialogContent>
    </div>
  );
}

// "prestart": "generate-env-getter js && prettier --write './**/*.{js,jsx}' --config .prettierrc.json",
// "pretest": "generate-env-getter js && prettier --write './**/*.{js,jsx}' --config .prettierrc.json",
// "prettier": "prettier --write './**/*.{js,jsx}' --config .prettierrc.json",
