import React, { useEffect, useState } from 'react';
import { Grid, Button, TextField, Autocomplete } from '@mui/material';
import axios from 'axios';
import DialogContent from '@mui/material/DialogContent';

export default function RestrictionForm({
  onClose,
  thisTenant,
  tenantValues,
  restrictionPage,
  agent,
  agents,
  setNewRestr
  //setAgents
}) {
  const [target_name, setTarget_Name] = useState(['']);
  const [target_id, setTarget_Id] = useState(['']);
  const [value, setValue] = useState(['']);
  const [name, setName] = useState('');

  const [services, setServices] = useState(['']);
  const [policies, setPolicies] = useState(['']);
  // const [agents, setAgents] = useState(['']);

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
      console.log('policiesTargets :', response.data);
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

  // const handleModify = async () => {
  //   const dataType = params.data
  //   try {
  //     await onAddRestriction(params.name, params.table_target, params.table_target_id, dataType);
  //     handleClose();
  //   } catch (error) {
  //     console.error("Une erreur s'est produite :", error);
  //   }
  // };

  // const handleAutocomplete = () => {

  // };

  const getAutocomplete = () => {
    switch (target_name) {
      case 'ServicePath':
        return (
          <Grid>
            <Autocomplete
              disablePortal
              id="service_paths"
              options={services}
              sx={{ marginBottom: 2, width: '100%' }}
              getOptionLabel={(option) => (option.path ? option.path : '')}
              getOptionSelected={(option, value) => option.path === value.path}
              renderInput={(params) => <TextField {...params} label="Paths from current Tenant" />}
              onChange={(event, newValue) => setTarget_Id(newValue.id || '')}
              value={services.find((option) => option.id === target_id) || 'Non defini'}
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
          <Autocomplete
            disablePortal
            id="policies"
            options={policies}
            sx={{ marginBottom: 2, width: '100%' }}
            getOptionLabel={(option) => (option.id ? option.id : '')}
            getOptionSelected={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} label="Policies from current Tenant" />}
            onChange={(event, newValue) => setTarget_Id(newValue.id || '')}
            value={policies.find((option) => option.id === target_id) || 'Non defini'}
          />
        );
      case 'Agent':
        if (!restrictionPage) {
          return (
            <Grid sx={{ marginBottom: 2, width: '100%' }}>
              <TextField
                id="agent"
                label="Agent"
                variant="outlined"
                defaultValue={agent}
                disabled
                sx={{
                  width: '100%'
                }}
              />
            </Grid>
          );
        } else {
          return (
            <Autocomplete
              disablePortal
              id="agents"
              options={agents}
              sx={{ marginBottom: 2, width: '100%' }}
              getOptionLabel={(option) => (option.name ? option.name : '')}
              getOptionSelected={(option, value) => option.iri === value.iri}
              renderInput={(params) => <TextField {...params} label="agents from current Tenant" />}
              onChange={(event, newValue) => setTarget_Id(newValue.iri || '')}
              value={agents.find((option) => option.iri === target_id) || 'Non defini'}
            />
          );
        }
      //Si non, si RestrictionPage => ...
      default:
        return null;
    }
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

  const handleSave = async () => {
    const dataType = getDataTypeForRestriction();
    const dataPayload = {
      type: dataType,
      value: value
    };
    try {
      // await onAddRestriction(name, target_name, target_id, dataPayload);
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
      console.log('REP ONSE =', response);
      handleClose();
    } catch (error) {
      console.error("Une erreur s'est produite :", error);
      throw error.response;
    }
  };

  //DATA POUR LES AUTOCOMPLETION DE CHAQUE PAERTIE DE POST DATA.
  //1
  //Faire un fetch pour les options, dans la table de la base de données associée (restrictionType):
  // Surement avec : const [optionsNameRestriction, setOptionsNameRestriction] = useState(...);
  // const optionsNameRestriction =  axios.get.....;

  //2
  // Les Target, les table de la base de données que l'on cible () :
  // Surement un : const [targetOptions, setTargetOptions] = useState();
  // Puis un fetch de la base de données si on crée une table propre aux target possibles (les elements en dessus) :
  //
  // ou
  //
  // const targetOptions = [
  //   { target: 'Policy' },
  //   { target: 'Agent' },
  //   { target: 'ServicePath' }
  // ];

  // 3
  // Les différents ID présents dnas la base, qui sont chérchées dans la table associée (valeur courante de targetOptions selectionnée)
  // axios.get ....
  // Surement avec : targetIdOptions =  axios.get.....;

  return (
    <div>
      <DialogContent>
        <Grid>
          <h2>Post a Restriction</h2>
          <Autocomplete
            disablePortal
            id="restrction-name"
            options={options}
            sx={{ marginBottom: 2, width: '100%' }}
            getOptionLabel={(option) => (option.name ? option.name : name)}
            getOptionSelected={(option, value) => option.name === value.name}
            renderInput={(params) => <TextField {...params} label="Restriction" />}
            onChange={handleAutocompleteChange}
            value={options.find((option) => option.name === name) || 'Non defini'}
          />
        </Grid>
        <Autocomplete
          disablePortal
          id="targets"
          options={targets}
          sx={{ marginBottom: 2, width: '100%' }}
          getOptionLabel={(option) => (option.target ? option.target : target_name)}
          getOptionSelected={(option, value) => option.target === value.target}
          renderInput={(params) => <TextField {...params} label="Targets" />}
          onChange={(event, newValue) => setTarget_Name(newValue.target || '')}
          value={targets.find((option) => option.target === target_name) || 'Non defini'}
        />
        {/* <Grid>
          <TextField
            type="text"
            id="target table"
            label="Target"
            variant="outlined"
            value={target_name}
            onChange={(e) => setTarget_Name(e.target.value)}
            sx={{ marginBottom: 2, width: '100%' }}
          />
        </Grid> */}
        {/* <Autocomplete
          disablePortal
          id="service_paths"
          options={services}
          sx={{ marginBottom: 2, width: '100%' }}
          getOptionLabel={(option) => (option.path ? option.path : '')}
          getOptionSelected={(option, value) => option.id === value.id}
          renderInput={(params) => <TextField {...params} label="Services" />}
          onChange={(event, newValue) => setTarget_Id(newValue.id || '')}
          value={services.find((option) => option.id === target_id) || 'Non defini'}
        /> */}
        {getAutocomplete()}
        {/* <Grid>
          <TextField
            type="text"
            id="target id"
            label="Target ID"
            variant="outlined"
            value={target_id}
            onChange={(e) => setTarget_Id(e.target.value)}
            sx={{ marginBottom: 2, width: '100%' }}
          />
        </Grid> */}
        <Grid>
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
          <Button variant="contained" color="primary" onClick={handleSave}>
            Post
          </Button>
        </Grid>
      </DialogContent>
    </div>
  );
}

// "prestart": "generate-env-getter js && prettier --write './**/*.{js,jsx}' --config .prettierrc.json",
// "pretest": "generate-env-getter js && prettier --write './**/*.{js,jsx}' --config .prettierrc.json",
// "prettier": "prettier --write './**/*.{js,jsx}' --config .prettierrc.json",
